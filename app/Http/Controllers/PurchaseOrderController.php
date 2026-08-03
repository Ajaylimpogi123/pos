<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Branch;
use App\Models\Supplier;
use App\Models\Ingredient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    // NOTE: no index() here — the combined Purchasing page (PRs + POs + Logs)
    // is handled by PurchaseRequestController@index via the `purchasing.index`
    // route. This resource is registered with ->except(['index']) in routes.

    public function create(Request $request): Response
    {
        $purchaseRequest = null;

        if ($request->filled('purchase_request_id')) {
            $purchaseRequest = PurchaseRequest::where('status', 'approved')
                ->with('items')
                ->findOrFail($request->integer('purchase_request_id'));
        }

        return Inertia::render('Purchase/CreateOrder', [
            'branches'        => Branch::all(['id', 'branch_name']),
            'suppliers'       => Supplier::all(['id', 'supplier_name']),
            'ingredients'     => Ingredient::all(['ing_id', 'ing_name', 'branch_id']),
            'purchaseRequest' => $purchaseRequest,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'purchase_request_id'    => ['nullable', 'integer', 'exists:tbl_purchase_request,id'],
            'branch_id'              => ['required', 'integer', 'exists:tbl_branch,id'],
            'supplier_id'            => ['nullable', 'integer', 'exists:tbl_supplier,id'],
            'order_date'             => ['nullable', 'date'],
            'expected_delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'remarks'                => ['nullable', 'string'],

            'items'               => ['required', 'array', 'min:1'],
            'items.*.ingredient_id' => [
                'nullable', 'integer',
                Rule::exists('tbl_ingredient', 'ing_id')
                    ->where(fn ($q) => $q->where('branch_id', $request->input('branch_id'))),
            ],
            'items.*.item_name'  => ['required', 'string', 'max:255'],
            'items.*.unit'       => ['nullable', 'string', 'max:50'],
            'items.*.quantity'   => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $purchaseOrder = DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'po_number'              => $this->generatePoNumber(),
                'purchase_request_id'    => $validated['purchase_request_id'] ?? null,
                'branch_id'              => $validated['branch_id'],
                'supplier_id'            => $validated['supplier_id'] ?? null,
                'created_by'             => Auth::id(),
                'order_date'             => $validated['order_date'] ?? now(),
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'remarks'                => $validated['remarks'] ?? null,
                'status'                 => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $po->items()->create($item); // subtotal auto-calculated on save
            }

            $po->recalculateTotal();

            // Mark the source PR as converted so it can't spawn duplicate POs
            if ($po->purchase_request_id) {
                $po->purchaseRequest?->update(['status' => 'converted']);
            }

            return $po;
        });

        return redirect()
            ->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase order created successfully!');
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load([
            'branch', 'supplier', 'createdBy', 'approvedBy',
            'purchaseRequest', 'items.ingredient',
        ]);

        return Inertia::render('Purchase/ShowOrder', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        $this->ensureEditable($purchaseOrder);

        $purchaseOrder->load('items');

        return Inertia::render('Purchase/EditOrder', [
            'purchaseOrder' => $purchaseOrder,
            'branches'      => Branch::all(['id', 'branch_name']),
            'suppliers'     => Supplier::all(['id', 'supplier_name']),
            'ingredients'   => Ingredient::all(['ing_id', 'ing_name', 'branch_id']),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->ensureEditable($purchaseOrder);

        $validated = $request->validate([
            'branch_id'              => ['required', 'integer', 'exists:tbl_branch,id'],
            'supplier_id'            => ['nullable', 'integer', 'exists:tbl_supplier,id'],
            'order_date'             => ['nullable', 'date'],
            'expected_delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'remarks'                => ['nullable', 'string'],

            'items'               => ['required', 'array', 'min:1'],
            'items.*.ingredient_id' => [
                'nullable', 'integer',
                Rule::exists('tbl_ingredient', 'ing_id')
                    ->where(fn ($q) => $q->where('branch_id', $request->input('branch_id'))),
            ],
            'items.*.item_name'  => ['required', 'string', 'max:255'],
            'items.*.unit'       => ['nullable', 'string', 'max:50'],
            'items.*.quantity'   => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $purchaseOrder->update([
                'branch_id'              => $validated['branch_id'],
                'supplier_id'            => $validated['supplier_id'] ?? null,
                'order_date'             => $validated['order_date'] ?? null,
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'remarks'                => $validated['remarks'] ?? null,
            ]);

            $purchaseOrder->items()->delete();
            foreach ($validated['items'] as $item) {
                $purchaseOrder->items()->create($item);
            }

            $purchaseOrder->recalculateTotal();
        });

        return redirect()
            ->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase order updated successfully!');
    }

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->ensureEditable($purchaseOrder);

        $purchaseOrder->delete();

        return redirect()
            ->route('purchasing.index')
            ->with('success', 'Purchase order deleted.');
    }

    // --- Approval actions ---

    public function approve(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $validated = $request->validate([
            'approval_remarks' => ['nullable', 'string'],
        ]);

        if ($purchaseOrder->status !== 'pending') {
            return back()->with('error', 'Only pending orders can be approved.');
        }

        $purchaseOrder->approve(Auth::user(), $validated['approval_remarks'] ?? null);

        return back()->with('success', 'Purchase order approved.');
    }

    public function reject(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $validated = $request->validate([
            'approval_remarks' => ['required', 'string'],
        ]);

        if ($purchaseOrder->status !== 'pending') {
            return back()->with('error', 'Only pending orders can be rejected.');
        }

        $purchaseOrder->reject(Auth::user(), $validated['approval_remarks']);

        return back()->with('success', 'Purchase order rejected.');
    }

    // Mark items received (full or partial), flip status accordingly, and
    // push the newly received quantities into ingredient stock + cost.
    public function receive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $validated = $request->validate([
            'items'                     => ['required', 'array', 'min:1'],
            'items.*.id'                => ['required', 'integer', 'exists:tbl_purchase_order_items,id'],
            'items.*.quantity_received' => ['required', 'numeric', 'min:0'],
        ]);

        if ($purchaseOrder->status !== 'approved' && $purchaseOrder->status !== 'partially_received') {
            return back()->with('error', 'Order must be approved before receiving items.');
        }

        try {
            DB::transaction(function () use ($validated, $purchaseOrder) {
                foreach ($validated['items'] as $item) {
                    $poItem = $purchaseOrder->items()->whereKey($item['id'])->first();
                    if (! $poItem) {
                        continue;
                    }

                    $newQtyReceived = (float) $item['quantity_received'];

                    if ($newQtyReceived > (float) $poItem->quantity) {
                        throw new \InvalidArgumentException(
                            "Received quantity for \"{$poItem->item_name}\" can't exceed the ordered quantity ({$poItem->quantity})."
                        );
                    }

                    $delta = $newQtyReceived - (float) $poItem->quantity_received;

                    $poItem->update(['quantity_received' => $newQtyReceived]);

                    // Only push to inventory for the newly received amount, and only
                    // when this line is linked to an actual stock ingredient (not a
                    // free-text / non-stock item).
                    if ($delta > 0 && $poItem->ingredient_id) {
                        $ingredient = Ingredient::whereKey($poItem->ingredient_id)
                            ->lockForUpdate()
                            ->first();

                        if ($ingredient) {
                            $oldQty = (float) $ingredient->ing_qty;
                            $oldCost = (float) $ingredient->ing_cost;
                            $incomingCost = (float) $poItem->unit_price;

                            $newQty = $oldQty + $delta;

                            // Weighted-average cost: blends what's already on the shelf
                            // with the cost of what just came in, weighted by quantity.
                            $newCost = $newQty > 0
                                ? (($oldQty * $oldCost) + ($delta * $incomingCost)) / $newQty
                                : $oldCost;

                            $ingredient->ing_qty = $newQty;
                            $ingredient->ing_cost = round($newCost, 2);
                            $ingredient->save();
                        }
                    }
                }

                $purchaseOrder->refresh();
                $fullyReceived = $purchaseOrder->items->every(
                    fn ($item) => $item->quantity_received >= $item->quantity
                );
                $anyReceived = $purchaseOrder->items->sum('quantity_received') > 0;

                $purchaseOrder->update([
                    'status' => $fullyReceived ? 'received' : ($anyReceived ? 'partially_received' : $purchaseOrder->status),
                ]);
            });
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Received quantities updated and ingredient stock adjusted.');
    }

    // --- Helpers ---

    private function ensureEditable(PurchaseOrder $purchaseOrder): void
    {
        abort_if(
            !in_array($purchaseOrder->status, ['pending']),
            403,
            'This purchase order can no longer be edited.'
        );
    }

    private function generatePoNumber(): string
    {
        $year = now()->format('Y');
        $count = PurchaseOrder::whereYear('created_at', $year)->count() + 1;

        return sprintf('PO-%s-%05d', $year, $count);
    }
}