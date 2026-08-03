import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import usePurchasingTabs from "./Hooks/Usepurchasingtabs";
import PurchaseRequestsTab from "./Partials/PurchaseRequestsTab";
import PurchaseOrdersTab from "./Partials/PurchaseOrdersTab";
import ReceivingTab from "./Partials/ReceivingTab";
import LogsTab from "./Partials/LogsTab";

export default function Index({
    purchaseRequests,
    purchaseOrders,
    receivableOrders,
    logs,
}) {
    const { activeTab, setActiveTab } = usePurchasingTabs();

    const tabs = [
        {
            key: "requests",
            label: "Purchase Requests",
            count: purchaseRequests.total,
        },
        {
            key: "orders",
            label: "Purchase Orders",
            count: purchaseOrders.total,
        },
        { key: "receiving", label: "Receiving", count: receivableOrders.total },
        { key: "logs", label: "Logs", count: null },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Purchasing" />

            <div className="relative z-10 py-8">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Purchasing
                        </h1>
                        <Link
                            href={route("purchase-requests.create")}
                            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white"
                        >
                            + New Purchase Request
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border">
                        {/* Tab headers */}
                        <div className="flex border-b">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                        activeTab === tab.key
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="p-4">
                            {activeTab === "requests" && (
                                <PurchaseRequestsTab
                                    purchaseRequests={purchaseRequests}
                                />
                            )}
                            {activeTab === "orders" && (
                                <PurchaseOrdersTab
                                    purchaseOrders={purchaseOrders}
                                />
                            )}
                            {activeTab === "receiving" && (
                                <ReceivingTab
                                    receivableOrders={receivableOrders}
                                />
                            )}
                            {activeTab === "logs" && <LogsTab logs={logs} />}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
