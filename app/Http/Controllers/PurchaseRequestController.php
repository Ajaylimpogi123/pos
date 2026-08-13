<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseOrder;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function index(): Response
    {
        $purchaseRequests = PurchaseRequest::with(['branch', 'requestedBy', 'items'])
            ->latest()
            ->paginate(15, ['*'], 'pr_page')
            ->withQueryString();

        $purchaseOrders = PurchaseOrder::with(['branch', 'supplier', 'createdBy', 'items'])
            ->latest()
            ->paginate(15, ['*'], 'po_page')
            ->withQueryString();

        $receivableOrders = PurchaseOrder::with(['branch', 'supplier', 'items'])
            ->whereIn('status', ['approved', 'partially_received'])
            ->latest()
            ->paginate(15, ['*'], 'receive_page')
            ->withQueryString();

        $logs = $this->buildLogs();

        return Inertia::render('Purchase/Index', [
            'purchaseRequests'  => $purchaseRequests,
            'purchaseOrders'    => $purchaseOrders,
            'receivableOrders'  => $receivableOrders,
            'logs'              => $logs,
        ]);
    }

    /**
     * Build a simple chronological activity feed from PR/PO timestamps.
     * NOTE: this reconstructs activity from created_at/approved_at/updated_at —
     * it won't distinguish edits from other updates. For a fully accurate trail
     * (who edited what, item-level changes, etc.) a dedicated activity_log
     * table logging each action explicitly is more reliable long-term.
     */
    private function buildLogs()
    {
        $prLogs = PurchaseRequest::with(['requestedBy', 'approvedBy'])
            ->latest()
            ->limit(100)
            ->get()
            ->flatMap(function ($pr) {
                $entries = collect([[
                    'at'        => $pr->created_at,
                    'type'      => 'PR',
                    'reference' => $pr->pr_number,
                    'action'    => 'Created',
                    'by'        => $pr->requestedBy->name ?? null,
                    'remarks'   => null,
                ]]);

                if ($pr->approved_at) {
                    $entries->push([
                        'at'        => $pr->approved_at,
                        'type'      => 'PR',
                        'reference' => $pr->pr_number,
                        'action'    => ucfirst($pr->status),
                        'by'        => $pr->approvedBy->name ?? null,
                        'remarks'   => $pr->approval_remarks,
                    ]);
                }

                return $entries;
            });

        $poLogs = PurchaseOrder::with(['createdBy', 'approvedBy'])
            ->latest()
            ->limit(100)
            ->get()
            ->flatMap(function ($po) {
                $entries = collect([[
                    'at'        => $po->created_at,
                    'type'      => 'PO',
                    'reference' => $po->po_number,
                    'action'    => 'Created',
                    'by'        => $po->createdBy->name ?? null,
                    'remarks'   => null,
                ]]);

                if ($po->approved_at) {
                    $entries->push([
                        'at'        => $po->approved_at,
                        'type'      => 'PO',
                        'reference' => $po->po_number,
                        'action'    => ucfirst($po->status),
                        'by'        => $po->approvedBy->name ?? null,
                        'remarks'   => $po->approval_remarks,
                    ]);
                }

                return $entries;
            });

        return $prLogs->concat($poLogs)
            ->sortByDesc('at')
            ->values()
            ->take(100)
            ->map(fn ($entry) => [
                ...$entry,
                'at' => $entry['at']->format('M d, Y h:i A'),
            ])
            ->all();
    }

    public function create(): Response
    {
        return Inertia::render('Purchase/CreateRequest', [
            'branches' => Branch::all(['id', 'branch_name']),
            'ingredients' => Ingredient::all(['ing_id', 'ing_name', 'branch_id']),
            'suppliers'   => Supplier::orderBy('supplier_name')->get(['id', 'supplier_name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id'    => ['required', 'integer', 'exists:tbl_branch,id'],
            
            'date_needed'  => ['nullable', 'date'],
            'remarks'      => ['nullable', 'string'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'       => [
                'nullable', 'integer',
                Rule::exists('tbl_ingredient', 'ing_id')
                    ->where(fn ($q) => $q->where('branch_id', $request->input('branch_id'))),
            ],
            'items.*.supplier_id' => ['nullable', 'integer', 'exists:tbl_supplier,id'],

            'items.*.item_name'           => ['required', 'string', 'max:255'],
            'items.*.unit'                => ['nullable', 'string', 'max:50'],
            'items.*.quantity'            => ['required', 'numeric', 'min:0.01'],
            'items.*.estimated_unit_price'=> ['nullable', 'numeric', 'min:0'],
            'items.*.remarks'             => ['nullable', 'string'],
        ]);

        $purchaseRequest = DB::transaction(function () use ($validated) {
            $pr = PurchaseRequest::create([
                'pr_number'    => $this->generatePrNumber(),
                'branch_id'    => $validated['branch_id'],
                'requested_by' => Auth::id(),
                'date_needed'  => $validated['date_needed'] ?? null,
                'remarks'      => $validated['remarks'] ?? null,
                'status'       => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $pr->items()->create($item);
            }

            return $pr;
        });

        return redirect()
            ->route('purchase-requests.show', $purchaseRequest)
            ->with('success', 'Purchase request submitted successfully!');
    }

    public function show(PurchaseRequest $purchaseRequest): Response
    {
        $purchaseRequest->load(['branch', 'requestedBy', 'approvedBy',  'items.ingredient', 'items.supplier', 'purchaseOrders']);

        return Inertia::render('Purchase/ShowRequest', [
            
            'purchaseRequest' => $purchaseRequest,
        ]);
    }

    public function edit(PurchaseRequest $purchaseRequest): Response
    {
        $this->ensureEditable($purchaseRequest);

        $purchaseRequest->load('items');

        return Inertia::render('Purchase/EditRequest', [
            'purchaseRequest' => $purchaseRequest,
            'branches'        => Branch::all(['id', 'branch_name']),
            'ingredients'     => Ingredient::all(['ing_id', 'ing_name', 'branch_id']),
            'suppliers'       => Supplier::orderBy('supplier_name')->get(['id', 'supplier_name']),
        ]);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->ensureEditable($purchaseRequest);

        $validated = $request->validate([
            'branch_id'    => ['required', 'integer', 'exists:tbl_branch,id'],
            'date_needed'  => ['nullable', 'date'],
            'remarks'      => ['nullable', 'string'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.id'                  => ['nullable', 'integer', 'exists:tbl_purchase_request_items,id'],
            'items.*.ingredient_id'       => [
                'nullable', 'integer',
                Rule::exists('tbl_ingredient', 'ing_id')
                    ->where(fn ($q) => $q->where('branch_id', $request->input('branch_id'))),
            ],
            'items.*.item_name'           => ['required', 'string', 'max:255'],
            'items.*.unit'                => ['nullable', 'string', 'max:50'],
            'items.*.quantity'            => ['required', 'numeric', 'min:0.01'],
            'items.*.estimated_unit_price'=> ['nullable', 'numeric', 'min:0'],
            'items.*.remarks'             => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $purchaseRequest) {
            $purchaseRequest->update([
                'branch_id'   => $validated['branch_id'],
                'date_needed' => $validated['date_needed'] ?? null,
                'remarks'     => $validated['remarks'] ?? null,
            ]);

            $purchaseRequest->items()->delete();
            foreach ($validated['items'] as $item) {
                unset($item['id']);
                $purchaseRequest->items()->create($item);
            }
        });

        return redirect()
            ->route('purchase-requests.show', $purchaseRequest)
            ->with('success', 'Purchase request updated successfully!');
    }

    public function destroy(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->ensureEditable($purchaseRequest);

        $purchaseRequest->delete();

        return redirect()
            ->route('purchasing.index')
            ->with('success', 'Purchase request deleted.');
    }

    // --- Approval actions ---

    public function approve(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $validated = $request->validate([
            'approval_remarks' => ['nullable', 'string'],
        ]);

        if ($purchaseRequest->status !== 'pending') {
            return back()->with('error', 'Only pending requests can be approved.');
        }

        $purchaseRequest->approve(Auth::user(), $validated['approval_remarks'] ?? null);

        return back()->with('success', 'Purchase request approved.');
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $validated = $request->validate([
            'approval_remarks' => ['required', 'string'],
        ]);

        if ($purchaseRequest->status !== 'pending') {
            return back()->with('error', 'Only pending requests can be rejected.');
        }

        $purchaseRequest->reject(Auth::user(), $validated['approval_remarks']);

        return back()->with('success', 'Purchase request rejected.');
    }

    // --- Helpers ---

    private function ensureEditable(PurchaseRequest $purchaseRequest): void
    {
        abort_if(
            !in_array($purchaseRequest->status, ['pending']),
            403,
            'This purchase request can no longer be edited.'
        );
    }

    private function generatePrNumber(): string
    {
        $year = now()->format('Y');
        $count = PurchaseRequest::whereYear('created_at', $year)->count() + 1;

        return sprintf('PR-%s-%05d', $year, $count);
    }
}