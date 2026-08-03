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
    public function store(Request $request, $table_id): RedirectResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'payment_method' => 'required|string|in:cash,gcash',
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

            // Get table
            $table = Table::findOrFail($table_id);

            // Generate invoice number
            $invoiceNo = 'INV-' . date('Ymd') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            // Get or create walk-in customer
            $customer = Customer::firstOrCreate(
                ['cust_fname' => 'Walk-in Customer'],
                ['cust_contact' => 'N/A']
            );

            // ── Step 1: Stock check BEFORE any writes ──────────────────────────
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

            // Stop here if anything failed the stock check
            if (!empty($stockErrors)) {
                DB::rollBack();
                return redirect()->back()->with('error', implode(' ', $stockErrors));
            }

            // Create order
            $order = Order::create([
                'cust_id' => $customer->cust_id,
                'table_id' => $table_id,
                'table_number' => $table->t_number,
                'invoice_no' => $invoiceNo,
                'payment_method' => $validated['payment_method'],
                'order_description' => 'Order for Table ' . $table->t_number,
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

            // Create order items + snapshot ingredients consumed
            foreach ($validated['items'] as $item) {
                $orderItem = OrderItems::create([
                    'od_id' => $order->od_id,
                    'pd_id' => $item['pd_id'],
                    'oi_qty' => $item['ct_qty'],
                    'oi_price' => $item['ct_price'],
                ]);

                // Update product qty
                $product = Product::with('ingredients')->find($item['pd_id']);
                if ($product) {
                    // Deduct product qty
                    $product->pd_qty = max(0, $product->pd_qty - $item['ct_qty']);
                    $product->pd_status = $product->pd_qty > 0 ? 'Available' : 'Not Available';
                    $product->save();

                    // Deduct each ingredient qty based on how many units were sold,
                    // and record a snapshot of what was consumed for this order item
                    foreach ($product->ingredients as $ingredient) {
                        $deductAmount = $ingredient->pivot->pd_ing_qty * $item['ct_qty'];

                        $newQty = max(0, $ingredient->ing_qty - $deductAmount);

                        // Update status based on new qty vs minimum qty
                        $newStatus = match(true) {
                            $newQty <= 0                      => 'Out of Stock',
                            $newQty <= $ingredient->ing_mqty   => 'Low Stock',
                            default                            => 'Available',
                        };

                        $ingredient->update([
                            'ing_qty'    => $newQty,
                            'ing_status' => $newStatus,
                        ]);

                        // Permanent record: which ingredients (and how much)
                        // were used to fulfill this specific order item.
                        // This snapshot is independent of tbl_product_ingredient,
                        // so it stays accurate even if the recipe changes later.
                        OrderItemIngredient::create([
                            'oid_id'  => $orderItem->oid_id,
                            'ing_id'  => $ingredient->ing_id,
                            'oii_qty' => $deductAmount,
                            'unit'    => $ingredient->unit,
                        ]);
                    }
                }
            }

            // Clear cart items for this table
            Cart::where('table_id', $table_id)->delete();

            DB::commit();

            // Load items with product + ingredient details for the receipt
            $order->load('items.products', 'items.ingredients.ingredient');

            // {Pinter logic here} - This is where you would send the order to the printer if needed.
            app(\App\Services\ReceiptPrinterService::class)->printReceipt($order);

            // Redirect back to menu page with flash data
            return redirect()->route('menu.menu', $table_id)
                ->with('success', 'Order placed successfully!')
                ->with('order', $order);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Validation failed');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return redirect()->back()
                ->with('error', 'Failed to place order: ' . $e->getMessage());
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
}