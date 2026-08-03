import { Link } from "@inertiajs/react";
import StatusBadge from "./StatusBadge";
import { formatDisplayDate } from "../Utils/Dateutils";
export default function ReceivingTab({ receivableOrders }) {
    return (
        <div>
            <p className="text-sm text-gray-500 mb-3">
                Purchase orders that are approved and awaiting delivery. Open
                one to record received quantities.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b bg-gray-50">
                            <th className="p-2">PO #</th>
                            <th className="p-2">Branch</th>
                            <th className="p-2">Supplier</th>
                            <th className="p-2">Expected Delivery</th>
                            <th className="p-2">Items</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receivableOrders.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-gray-400 py-6"
                                >
                                    Nothing waiting to be received right now.
                                </td>
                            </tr>
                        )}

                        {receivableOrders.data.map((po) => {
                            const totalOrdered = po.items.reduce(
                                (sum, i) => sum + Number(i.quantity),
                                0,
                            );
                            const totalReceived = po.items.reduce(
                                (sum, i) => sum + Number(i.quantity_received),
                                0,
                            );

                            return (
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
                                        {formatDisplayDate(
                                            po.expected_delivery_date,
                                        ) ?? "—"}
                                    </td>
                                    <td className="p-2">
                                        {totalReceived} / {totalOrdered}{" "}
                                        received
                                    </td>
                                    <td className="p-2">
                                        <StatusBadge status={po.status} />
                                    </td>
                                    <td className="p-2 text-right">
                                        <Link
                                            href={route(
                                                "purchase-orders.show",
                                                po.id,
                                            )}
                                            className="text-xs px-2 py-1 rounded-md bg-cyan-600 text-white"
                                        >
                                            Receive Items
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-1 mt-3 justify-end">
                {receivableOrders.links.map((link, i) => (
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
        </div>
    );
}
