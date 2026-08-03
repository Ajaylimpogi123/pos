import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import StatusBadge from "./StatusBadge";
import RejectModal from "./RejectModal";
import { formatDisplayDate } from "../Utils/Dateutils";
import { usePage } from "@inertiajs/react";
export default function PurchaseOrdersTab({ purchaseOrders }) {
    const ADMIN_ROLE_ID = 2;

    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role_id === ADMIN_ROLE_ID;

    const [rejectTarget, setRejectTarget] = useState(null);

    const handleApprove = (id) => {
        if (!confirm("Approve this purchase order?")) return;
        router.post(
            route("purchase-orders.approve", id),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b bg-gray-50">
                            <th className="p-2">PO #</th>
                            <th className="p-2">Branch</th>
                            <th className="p-2">Supplier</th>
                            <th className="p-2">Order Date</th>
                            <th className="p-2">Total</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-gray-400 py-6"
                                >
                                    No purchase orders yet.
                                </td>
                            </tr>
                        )}

                        {purchaseOrders.data.map((po) => (
                            <tr
                                key={po.id}
                                className="border-b hover:bg-gray-50"
                            >
                                <td className="p-2">
                                    <Link
                                        href={route(
                                            "purchase-orders.show",
                                            po.id,
                                        )}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {po.po_number}
                                    </Link>
                                </td>
                                <td className="p-2">
                                    {po.branch?.branch_name ?? "—"}
                                </td>
                                <td className="p-2">
                                    {po.supplier?.supplier_name ?? "—"}
                                </td>
                                <td className="p-2">
                                    {formatDisplayDate(po.order_date) ?? "—"}
                                </td>
                                <td className="p-2">
                                    ₱
                                    {Number(po.total_amount).toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                        },
                                    )}
                                </td>
                                <td className="p-2">
                                    <StatusBadge status={po.status} />
                                </td>
                                <td className="p-2 text-center space-x-1">
                                    <Link
                                        href={route(
                                            "purchase-orders.show",
                                            po.id,
                                        )}
                                        className="text-xs px-2 py-1 border rounded-md"
                                    >
                                        View
                                    </Link>

                                    {po.status === "pending" && isAdmin && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleApprove(po.id)
                                                }
                                                className="text-xs px-2 py-1 rounded-md bg-green-600 text-white"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setRejectTarget(po)
                                                }
                                                className="text-xs px-2 py-1 rounded-md bg-red-600 text-white"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-1 mt-3 justify-end">
                {purchaseOrders.links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.url ?? "#"}
                        preserveScroll
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-2 py-1 text-xs rounded-md border ${
                            link.active
                                ? "bg-gray-900 text-white"
                                : "text-gray-600"
                        } ${!link.url ? "opacity-40 pointer-events-none" : ""}`}
                    />
                ))}
            </div>

            <RejectModal
                open={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                actionUrl={
                    rejectTarget
                        ? route("purchase-orders.reject", rejectTarget.id)
                        : "#"
                }
                title={`Reject ${rejectTarget?.po_number ?? ""}`}
            />
        </div>
    );
}
