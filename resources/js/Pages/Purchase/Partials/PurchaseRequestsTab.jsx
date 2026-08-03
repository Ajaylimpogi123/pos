import { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import StatusBadge from "./StatusBadge";
import RejectModal from "./RejectModal";
import { formatDisplayDate } from "../Utils/Dateutils";

const ADMIN_ROLE_ID = 2;

export default function PurchaseRequestsTab({ purchaseRequests }) {
    const [rejectTarget, setRejectTarget] = useState(null);

    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role_id === ADMIN_ROLE_ID;

    const handleApprove = (id) => {
        if (!confirm("Approve this purchase request?")) return;
        router.post(
            route("purchase-requests.approve", id),
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
                            <th className="p-2">PR #</th>
                            <th className="p-2">Branch</th>
                            <th className="p-2">Requested By</th>
                            <th className="p-2">Date Needed</th>
                            <th className="p-2">Items</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseRequests.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-gray-400 py-6"
                                >
                                    No purchase requests yet.
                                </td>
                            </tr>
                        )}

                        {purchaseRequests.data.map((pr) => (
                            <tr
                                key={pr.id}
                                className="border-b hover:bg-gray-50"
                            >
                                <td className="p-2">
                                    <Link
                                        href={route(
                                            "purchase-requests.show",
                                            pr.id,
                                        )}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {pr.pr_number}
                                    </Link>
                                </td>
                                <td className="p-2">
                                    {pr.branch?.branch_name ?? "—"}
                                </td>
                                <td className="p-2">
                                    {pr.requested_by?.name ?? "—"}
                                </td>
                                <td className="p-2">
                                    {formatDisplayDate(pr.date_needed) ?? "—"}
                                </td>
                                <td className="p-2">{pr.items?.length ?? 0}</td>
                                <td className="p-2">
                                    <StatusBadge status={pr.status} />
                                </td>
                                <td className="p-2 text-center space-x-1">
                                    <Link
                                        href={route(
                                            "purchase-requests.show",
                                            pr.id,
                                        )}
                                        className="text-xs px-2 py-1 border rounded-md"
                                    >
                                        View
                                    </Link>

                                    {pr.status === "pending" && isAdmin && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleApprove(pr.id)
                                                }
                                                className="text-xs px-2 py-1 rounded-md bg-green-600 text-white"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setRejectTarget(pr)
                                                }
                                                className="text-xs px-2 py-1 rounded-md bg-red-600 text-white"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {pr.status === "approved" && isAdmin && (
                                        <Link
                                            href={route(
                                                "purchase-orders.create",
                                                {
                                                    purchase_request_id: pr.id,
                                                },
                                            )}
                                            className="text-xs px-2 py-1 rounded-md bg-blue-600 text-white"
                                        >
                                            Convert to PO
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex gap-1 mt-3 justify-end">
                {purchaseRequests.links.map((link, i) => (
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

            {isAdmin && (
                <RejectModal
                    open={!!rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    actionUrl={
                        rejectTarget
                            ? route("purchase-requests.reject", rejectTarget.id)
                            : "#"
                    }
                    title={`Reject ${rejectTarget?.pr_number ?? ""}`}
                />
            )}
        </div>
    );
}
