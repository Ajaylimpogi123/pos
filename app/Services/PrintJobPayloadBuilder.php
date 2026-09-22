<?php

namespace App\Services;

use App\Models\Order;

/**
 * Builds the fully self-contained JSON payloads stored on tbl_print_job.
 * The print agent never touches the database directly, so everything it
 * needs to reproduce a ticket must be snapshotted here at enqueue time —
 * not a reference (e.g. an od_id) that could point at data which changes
 * or disappears before the agent gets to it.
 */
class PrintJobPayloadBuilder
{
    /**
     * Same header/items shape ReceiptPrinterService::buildReceipt() expects,
     * snapshotted from the order and its items at enqueue time.
     */
    public function forReceipt(Order $order): array
    {
        $order->loadMissing('items.products');

        $header = [
            'store_name' => config('printer.store_name'),
            'invoice_no' => $order->invoice_no,
            'created_at' => $order->created_at->format('Y-m-d H:i'),
            'total' => (float) $order->od_total_amt_due,
            'payment_method' => $order->payment_method,
            'payment' => (float) $order->od_payment,
            'change' => (float) $order->od_change,
        ];

        $items = $order->items->map(fn ($item) => [
            'name' => $item->products->pd_name ?? 'Item',
            'qty' => $item->oi_qty,
            'price' => (float) $item->oi_price,
        ])->all();

        return [
            'header' => $header,
            'items' => $items,
        ];
    }

    /**
     * Payload for a single printer's slice of a queued kitchen ticket.
     *
     * @param  array  $unprintedRows  [['pd_id', 'pd_name', 'ct_qty' (unprinted amount),
     *                                'cat_id', 'ct_id'], ...] — the same shape
     *                                OrderController::printKitchen() already builds,
     *                                scoped to just the rows routed to one printer.
     * @return array{ticket_tag: string, items: array, cart_snapshot: array}
     */
    public function forKitchen(array $unprintedRows, string $ticketTag): array
    {
        $items = array_map(fn ($row) => [
            'pd_name' => $row['pd_name'] ?? 'Item',
            'ct_qty' => $row['ct_qty'] ?? 1,
        ], $unprintedRows);

        // Exact unprinted quantity being sent to print for each cart row —
        // used later to increment (not overwrite) ct_printed_qty once the
        // agent reports success, so a customer adding more of the same item
        // mid-flight isn't wrongly marked as already printed.
        $cartSnapshot = array_map(fn ($row) => [
            'ct_id' => $row['ct_id'],
            'qty' => $row['ct_qty'] ?? 1,
        ], $unprintedRows);

        return [
            'ticket_tag' => $ticketTag,
            'items' => $items,
            'cart_snapshot' => $cartSnapshot,
        ];
    }
}
