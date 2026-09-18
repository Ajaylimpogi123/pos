<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\OrderItemIngredient;
use App\Models\Table;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OrderController extends Controller
{
   public function store(Request $request): RedirectResponse
{
    try {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,gcash',
            'reference_no'   => 'required_if:payment_method,gcash|nullable|string|max:100',
            'od_amount_due' => 'required|numeric|min:0',
            'od_discount' => 'nullable|numeric|min:0',
            'od_total_amt_due' => 'required|numeric|min:0',
            'od_payment' => 'required|numeric|min:0',
            'od_change' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.pd_id' => 'required|integer',
            'items.*.ct_qty' => 'required|integer|min:1',
            'items.*.ct_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();

        $invoiceNo = 'INV-' . date('Ymd') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

        // Daily queue number — locked to avoid two checkouts on the same
        // terminal grabbing the same number in a race.
        $queueNo = Order::whereDate('created_at', today())->lockForUpdate()->count() + 1;

        $customer = Customer::firstOrCreate(
            ['cust_fname' => 'Walk-in Customer'],
            ['cust_contact' => 'N/A']
        );

        $stockErrors = [];

        foreach ($validated['items'] as $item) {
            $product = Product::with('ingredients')->find($item['pd_id']);

            if (!$product) {
                $stockErrors[] = "Product ID {$item['pd_id']} not found.";
                continue;
            }

            foreach ($product->ingredients as $ingredient) {
                $required  = $ingredient->pivot->pd_ing_qty * $item['ct_qty'];
                $available = $ingredient->ing_qty;

                if ($available <= 0) {
                    $stockErrors[] = sprintf('%s is out of stock. Cannot process %s.', $ingredient->ing_name, $product->pd_name);
                } elseif ($available < $required) {
                    $stockErrors[] = sprintf('Not enough %s for %s. Required: %s %s, Available: %s %s.', $ingredient->ing_name, $product->pd_name, $required, $ingredient->unit, $available, $ingredient->unit);
                }
            }
        }

        if (!empty($stockErrors)) {
            DB::rollBack();
            return redirect()->back()->with('error', implode(' ', $stockErrors));
        }

        $order = Order::create([
            'cust_id' => $customer->cust_id,
            'queue_no' => $queueNo,
            'invoice_no' => $invoiceNo,
            'payment_method' => $validated['payment_method'],
            'reference_no' => $validated['reference_no'] ?? null,
            'order_description' => 'Order #' . $queueNo,
            'od_amount_due' => $validated['od_amount_due'],
            'od_discount' => $validated['od_discount'] ?? 0,
            'percent_discount' => 0,
            'od_total_amt_due' => $validated['od_total_amt_due'],
            'od_payment' => $validated['od_payment'],
            'od_change' => $validated['od_change'],
            'other_charges' => 0,
            'is_open' => 0,
            'is_print' => 0,
            'od_remarks' => '',
        ]);

        foreach ($validated['items'] as $item) {
            $orderItem = OrderItems::create([
                'od_id' => $order->od_id,
                'pd_id' => $item['pd_id'],
                'oi_qty' => $item['ct_qty'],
                'oi_price' => $item['ct_price'],
            ]);

            $product = Product::with('ingredients')->find($item['pd_id']);
            if ($product) {
                $product->pd_qty = max(0, $product->pd_qty - $item['ct_qty']);
                $product->pd_status = $product->pd_qty > 0 ? 'Available' : 'Not Available';
                $product->save();

                foreach ($product->ingredients as $ingredient) {
                    $deductAmount = $ingredient->pivot->pd_ing_qty * $item['ct_qty'];
                    $newQty = max(0, $ingredient->ing_qty - $deductAmount);

                    $newStatus = match(true) {
                        $newQty <= 0                      => 'Out of Stock',
                        $newQty <= $ingredient->ing_mqty   => 'Low Stock',
                        default                            => 'Available',
                    };

                    $ingredient->update(['ing_qty' => $newQty, 'ing_status' => $newStatus]);

                    OrderItemIngredient::create([
                        'oid_id'  => $orderItem->oid_id,
                        'ing_id'  => $ingredient->ing_id,
                        'oii_qty' => $deductAmount,
                        'unit'    => $ingredient->unit,
                    ]);
                }
            }
        }

        // Single shared cart — checkout clears it entirely.
      // Single shared cart — checkout clears it entirely.
// (delete(), not truncate() — TRUNCATE is DDL and MySQL auto-commits any
// open transaction the instant it runs, which silently broke the
// surrounding DB::beginTransaction()/commit() here.)
Cart::query()->delete();

        DB::commit();

        $order->load('items.products', 'items.ingredients.ingredient');

        return redirect()->route('menu.menu')
            ->with('success', 'Order placed successfully!')
            ->with('order', $order);

    } catch (\Illuminate\Validation\ValidationException $e) {
        DB::rollBack();
        return redirect()->back()->withErrors($e->errors())->with('error', 'Validation failed');
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Order Error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return redirect()->back()->with('error', 'Failed to place order: ' . $e->getMessage());
    }
}

    public function print($od_id)
    {
        try {
            // Load order with relationships, including ingredient snapshot
            $order = Order::with(['items.products', 'items.ingredients.ingredient', 'customer'])->findOrFail($od_id);

            // Mark as printed
            $order->update(['is_print' => 1]);

            // Return Inertia view
            return Inertia::render('Menu/Partials/ReceiptPrint', [
                'order' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Print Error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to load receipt');
        }
    }
    
/**
 * Print only what hasn't been sent to the kitchen yet for the shared
 * cart. Diffs ct_qty against ct_printed_qty per row, prints the
 * outstanding amount, then marks it printed. Every failure mode is
 * caught and reported distinctly so staff know exactly what to check.
 */
public function printKitchen(Request $request)
{
    // 1. Load cart — fail loudly if the query itself breaks (bad DB
    //    connection, etc.) rather than letting it bubble to a 500
    try {
        $cartRows = Cart::with('product:pd_id,pd_name,cat_id')->get();
    } catch (\Exception $e) {
        Log::error('Failed to load cart for kitchen print: ' . $e->getMessage());
        return redirect()->back()->with('error', 'Could not load cart items. Please try again.');
    }

    if ($cartRows->isEmpty()) {
        return redirect()->back()->with('error', 'Cart is empty — nothing to print.');
    }

    // Ticket tag replaces the old table number on the printed ticket.
    $ticketTag = 'TKT-' . now()->format('His');

    // 2. Build the unprinted diff, flagging rows with missing product
    //    data instead of silently dropping them
    $newItems = [];
    $ctIdsToMark = [];
    $skipped = [];

    foreach ($cartRows as $row) {
        $unprinted = $row->ct_qty - $row->ct_printed_qty;

        if ($unprinted <= 0) {
            continue;
        }

        if (!$row->product) {
            // Product was deleted/unlinked after being added to cart —
            // don't silently skip this without telling anyone
            $skipped[] = $row->ct_id;
            Log::warning('Cart row has no linked product, skipped from kitchen print', [
                'ct_id' => $row->ct_id,
                'pd_id' => $row->pd_id,
            ]);
            continue;
        }

        $newItems[] = [
            'pd_id'   => $row->pd_id,
            'pd_name' => $row->product->pd_name,
            'ct_qty'  => $unprinted,
            'cat_id'  => $row->product->cat_id,
        ];
        $ctIdsToMark[] = $row->ct_id;
    }

    if (empty($newItems)) {
        $msg = !empty($skipped)
            ? 'No new items to print (some items are missing product data — check logs).'
            : 'No new items to print.';
        return redirect()->back()->with('error', $msg);
    }

    // 3. Attempt the print — catch printer-layer exceptions separately
    //    from everything else, since this is the step most likely to
    //    fail in the field (printer off, wrong IP, network down)
    try {
        $results = app(\App\Services\ReceiptPrinterService::class)
            ->printKitchenPreview($newItems, $ticketTag, true);
    } catch (\Exception $e) {
        Log::error('Printer service threw an exception: ' . $e->getMessage(), [
            'items' => $newItems,
        ]);
        return redirect()->back()->with('error', 'Printer error: ' . $e->getMessage());
    }

    // 4. Inspect per-printer results — with category routing, some
    //    printers can succeed while others fail (e.g. kitchen printer
    //    reachable, bar printer off). Report exactly which failed.
    $failedPrinters = array_keys(array_filter($results, fn($ok) => $ok === false));
    $succeededPrinters = array_keys(array_filter($results, fn($ok) => $ok === true));

    if (empty($succeededPrinters)) {
        Log::error('All configured printers failed for kitchen print', [
            'attempted_printers' => array_keys($results),
        ]);
        return redirect()->back()->with(
            'error',
            'Could not reach any printer (' . implode(', ', array_keys($results)) . '). Check that it is powered on and connected to the network.'
        );
    }

    // 5. Only mark items as printed if their specific target printer
    //    actually succeeded — otherwise a failed bar ticket would get
    //    silently marked "printed" just because the kitchen ticket worked
    $routing = config('printer.category_routing', []);
    $ctIdsActuallyPrinted = [];

    foreach ($cartRows as $row) {
        if (!in_array($row->ct_id, $ctIdsToMark, true)) {
            continue;
        }
        $target = $routing[$row->product?->cat_id ?? null] ?? 'kitchen';
        if (in_array($target, $succeededPrinters, true)) {
            $ctIdsActuallyPrinted[] = $row->ct_id;
        }
    }

    // 6. Persist via query builder (bypasses Eloquent mass-assignment
    //    protection) — wrapped so a DB failure here is reported clearly
    //    rather than silently leaving printed_qty stale after a real print
    if (!empty($ctIdsActuallyPrinted)) {
        try {
            DB::table('tbl_cart')
                ->whereIn('ct_id', $ctIdsActuallyPrinted)
                ->update(['ct_printed_qty' => DB::raw('ct_qty')]);
        } catch (\Exception $e) {
            Log::error('Printed successfully but failed to update ct_printed_qty: ' . $e->getMessage(), [
                'ct_ids' => $ctIdsActuallyPrinted,
            ]);
            return redirect()->back()->with(
                'error',
                'Ticket printed, but failed to update tracking — the same items may print again next time. Contact support.'
            );
        }
    }

    if (!empty($failedPrinters)) {
        return redirect()->back()->with(
            'error',
            'Printed to ' . implode(', ', $succeededPrinters) . ', but ' . implode(', ', $failedPrinters) . ' failed. Those items were not marked as sent.'
        );
    }

    return redirect()->back()->with('success', 'Kitchen ticket sent to printer.');
}
}

