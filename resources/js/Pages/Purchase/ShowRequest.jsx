import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatusBadge from "./Partials/StatusBadge";
import RejectModal from "./Partials/RejectModal";

export default function ShowRequest({ purchaseRequest }) {
    const [rejectOpen, setRejectOpen] = useState(false);

    const handleApprove = () => {
        if (!confirm("Approve this purchase request?")) return;
        router.post(
            route("purchase-requests.approve", purchaseRequest.id),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={purchaseRequest.pr_number} />

            <div className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">
                        {purchaseRequest.pr_number}
                    </h1>
                    <StatusBadge status={purchaseRequest.status} />
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500">Branch</div>
                            <div>
                                {purchaseRequest.branch?.branch_name ?? "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Requested By</div>
                            <div>
                                {purchaseRequest.requested_by?.name ?? "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Date Needed</div>
                            <div>{purchaseRequest.date_needed ?? "—"}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Remarks</div>
                            <div>{purchaseRequest.remarks ?? "—"}</div>
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
                                    <th className="p-2">Quantity</th>
                                    <th className="p-2">Est. Unit Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseRequest.items.map((item) => (
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
                                            {item.estimated_unit_price
                                                ? `₱${Number(item.estimated_unit_price).toFixed(2)}`
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {purchaseRequest.status === "rejected" &&
                        purchaseRequest.approval_remarks && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                <strong>Rejection reason:</strong>{" "}
                                {purchaseRequest.approval_remarks}
                            </div>
                        )}

                    <div className="flex justify-between pt-2">
                        <a
                            href={route("purchasing.index")}
                            className="px-4 py-2 text-sm rounded-md border"
                        >
                            Back
                        </a>

                        <div className="space-x-2">
                            {purchaseRequest.status === "pending" && (
                                <>
                                    <Link
                                        href={route(
                                            "purchase-requests.edit",
                                            purchaseRequest.id,
                                        )}
                                        className="px-4 py-2 text-sm rounded-md border"
                                    >
                                        Edit
                                    </Link>
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
                                </>
                            )}

                            {purchaseRequest.status === "approved" && (
                                <Link
                                    href={route("purchase-orders.create", {
                                        purchase_request_id: purchaseRequest.id,
                                    })}
                                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white"
                                >
                                    Convert to Purchase Order
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <RejectModal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                actionUrl={route(
                    "purchase-requests.reject",
                    purchaseRequest.id,
                )}
                title={`Reject ${purchaseRequest.pr_number}`}
            />
        </AuthenticatedLayout>
    );
}
