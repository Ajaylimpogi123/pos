import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ItemsEditor from "./Partials/ItemsEditor";

export default function CreateOrder({
    branches,
    suppliers,
    ingredients,
    purchaseRequest,
}) {
    const { data, setData, post, processing, errors } = useForm({
        purchase_request_id: purchaseRequest?.id ?? "",
        branch_id: purchaseRequest?.branch_id ?? "",
        supplier_id: "",
        order_date: "",
        expected_delivery_date: "",
        remarks: "",
        items: purchaseRequest
            ? purchaseRequest.items.map((i) => ({
                  ingredient_id: i.ingredient_id ?? "",
                  item_name: i.item_name,
                  supplier_id: i.supplier_id ?? "",
                  unit: i.unit ?? "",
                  quantity: i.quantity,
                  unit_price: i.estimated_unit_price ?? "",
              }))
            : [
                  {
                      ingredient_id: "",
                      supplier_id: "",
                      item_name: "",
                      unit: "",
                      quantity: 1,
                      unit_price: "",
                  },
              ],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("purchase-orders.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Purchase Order" />

            <div className="p-4 md:p-6 max-w-6xl relative z-10 mx-auto">
                <h1 className="text-xl font-semibold mb-1 text-white">
                    New Purchase Order
                </h1>
                {purchaseRequest && (
                    <p className="text-sm text-white mb-4">
                        Converting from{" "}
                        <span className="font-medium">
                            {purchaseRequest.pr_number}
                        </span>
                    </p>
                )}

                <form
                    onSubmit={submit}
                    className="bg-white rounded-lg shadow-sm border p-5 space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Branch
                            </label>
                            <select
                                value={data.branch_id}
                                onChange={(e) =>
                                    setData("branch_id", e.target.value)
                                }
                                className="w-full border rounded-md px-2 py-1.5"
                            >
                                <option value="">Select branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.branch_name}
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.branch_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Order Date
                            </label>
                            <input
                                type="date"
                                value={data.order_date}
                                onChange={(e) =>
                                    setData("order_date", e.target.value)
                                }
                                className="w-full border rounded-md px-2 py-1.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Expected Delivery Date
                            </label>
                            <input
                                type="date"
                                value={data.expected_delivery_date}
                                onChange={(e) =>
                                    setData(
                                        "expected_delivery_date",
                                        e.target.value,
                                    )
                                }
                                className="w-full border rounded-md px-2 py-1.5"
                            />
                            {errors.expected_delivery_date && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.expected_delivery_date}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Remarks
                        </label>
                        <textarea
                            value={data.remarks}
                            onChange={(e) => setData("remarks", e.target.value)}
                            rows={2}
                            className="w-full border rounded-md px-2 py-1.5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Items
                        </label>
                        <ItemsEditor
                            items={data.items}
                            onChange={(items) => setData("items", items)}
                            ingredients={ingredients}
                            priceField="unit_price"
                            priceLabel="Unit Price"
                            suppliers={suppliers}
                        />
                        {errors.items && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.items}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <a
                            href={route("purchasing.index")}
                            className="px-4 py-2 text-sm rounded-md border"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
                        >
                            {processing
                                ? "Submitting..."
                                : "Create Purchase Order"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
