import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatusBadge from "./Partials/StatusBadge";
import RejectModal from "./Partials/RejectModal";
import { usePage } from "@inertiajs/react";

function ReceiveItemCell({ purchaseOrderId, item }) {
    const remaining = Number(item.quantity) - Number(item.quantity_received);
    const alreadyFull = remaining <= 0;

    const [qty, setQty] = useState(item.quantity_received);
    const [submitting, setSubmitting] = useState(false);

    const confirmReceive = () => {
        setSubmitting(true);
        router.post(
            route("purchase-order-items.receive", {
                purchaseOrder: purchaseOrderId,
                item: item.id,
            }),
            { quantity_received: qty },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <td className="p-2">
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    disabled={alreadyFull || submitting}
                    className="w-24 border rounded-md px-2 py-1 disabled:bg-gray-100"
                />
                <button
                    onClick={confirmReceive}
                    disabled={alreadyFull || submitting}
                    className="text-xs px-2 py-1 rounded-md bg-cyan-600 text-white disabled:opacity-40 whitespace-nowrap"
                >
                    {alreadyFull
                        ? "Received"
                        : submitting
                          ? "Saving..."
                          : "Confirm Receive"}
                </button>
            </div>
        </td>
    );
}

export default function ShowOrder({ purchaseOrder }) {
    const ADMIN_ROLE_ID = 2;

    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role_id === ADMIN_ROLE_ID;

    const [rejectOpen, setRejectOpen] = useState(false);

    const canReceive =
        purchaseOrder.status === "approved" ||
        purchaseOrder.status === "partially_received";

    const handleApprove = () => {
        if (!confirm("Approve this purchase order?")) return;
        router.post(
            route("purchase-orders.approve", purchaseOrder.id),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={purchaseOrder.po_number} />

            <div className="p-4 md:p-6 relative z-10 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">
                        {purchaseOrder.po_number}
                    </h1>
                    <StatusBadge status={purchaseOrder.status} />
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500">Branch</div>
                            <div>
                                {purchaseOrder.branch?.branch_name ?? "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Supplier</div>
                            <div>
                                {purchaseOrder.supplier?.supplier_name ?? "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Order Date</div>
                            <div>{purchaseOrder.order_date ?? "—"}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">
                                Expected Delivery
                            </div>
                            <div>
                                {purchaseOrder.expected_delivery_date ?? "—"}
                            </div>
                        </div>
                        {purchaseOrder.purchase_request && (
                            <div>
                                <div className="text-gray-500">
                                    Source Purchase Request
                                </div>
                                <Link
                                    href={route(
                                        "purchase-requests.show",
                                        purchaseOrder.purchase_request.id,
                                    )}
                                    className="text-blue-600 hover:underline"
                                >
                                    {purchaseOrder.purchase_request.pr_number}
                                </Link>
                            </div>
                        )}
                        <div>
                            <div className="text-gray-500">Total Amount</div>
                            <div className="font-medium">
                                ₱
                                {Number(
                                    purchaseOrder.total_amount,
                                ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-medium mb-2">Items</h2>
                        <table className="w-full text-sm border">
                            <thead>
                                <tr className="bg-gray-50 text-left border-b">
                                    <th className="p-2">Item</th>
                                    <th className="p-2">Supplier</th>
                                    <th className="p-2">Unit</th>
                                    <th className="p-2">Qty Ordered</th>
                                    <th className="p-2">Unit Price</th>
                                    <th className="p-2">Subtotal</th>
                                    {canReceive && (
                                        <th className="p-2">Qty Received</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrder.items.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">
                                            {item.item_name}
                                        </td>
                                        <td className="p-2">
                                            {item.supplier?.supplier_name ??
                                                "—"}
                                        </td>
                                        <td className="p-2">
                                            {item.unit ?? "—"}
                                        </td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2">
                                            ₱
                                            {Number(item.unit_price).toFixed(2)}
                                        </td>
                                        <td className="p-2">
                                            ₱{Number(item.subtotal).toFixed(2)}
                                        </td>
                                        {canReceive && (
                                            <ReceiveItemCell
                                                purchaseOrderId={
                                                    purchaseOrder.id
                                                }
                                                item={item}
                                            />
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {purchaseOrder.status === "rejected" &&
                        purchaseOrder.approval_remarks && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                <strong>Rejection reason:</strong>{" "}
                                {purchaseOrder.approval_remarks}
                            </div>
                        )}

                    <div className="flex justify-between pt-2">
                        <a
                            href={route("purchasing.index")}
                            className="px-4 py-2 text-sm rounded-md border"
                        >
                            Back
                        </a>

                        <Link
                            href={route(
                                "purchase-orders.edit",
                                purchaseOrder.id,
                            )}
                            className="px-4 py-2 text-sm rounded-md border text-blue-600 hover:bg-blue-50 hover:border-blue-600"
                        >
                            Edit
                        </Link>

                        {purchaseOrder.status === "pending" && isAdmin && (
                            <div className="space-x-2">
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2 text-sm rounded-md bg-green-600 text-white"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectOpen(true)}
                                    className="px-4 py-2 text-sm rounded-md bg-red-600 text-white"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RejectModal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                actionUrl={route("purchase-orders.reject", purchaseOrder.id)}
                title={`Reject ${purchaseOrder.po_number}`}
            />
        </AuthenticatedLayout>
    );
}
