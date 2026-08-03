import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ItemsEditor from "./Partials/ItemsEditor";

export default function EditOrder({
    purchaseOrder,
    branches,
    suppliers,
    ingredients,
}) {
    const { data, setData, put, processing, errors } = useForm({
        branch_id: purchaseOrder.branch_id ?? "",
        supplier_id: purchaseOrder.supplier_id ?? "",
        order_date: purchaseOrder.order_date ?? "",
        expected_delivery_date: purchaseOrder.expected_delivery_date ?? "",
        remarks: purchaseOrder.remarks ?? "",
        items: purchaseOrder.items.length
            ? purchaseOrder.items.map((i) => ({
                  ingredient_id: i.ingredient_id ?? "",
                  item_name: i.item_name,
                  unit: i.unit ?? "",
                  quantity: i.quantity,
                  unit_price: i.unit_price ?? "",
              }))
            : [
                  {
                      ingredient_id: "",
                      item_name: "",
                      unit: "",
                      quantity: 1,
                      unit_price: "",
                  },
              ],
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("purchase-orders.update", purchaseOrder.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${purchaseOrder.po_number}`} />

            <div className="p-4 md:p-6 max-w-4xl relative z-10">
                <h1 className="text-xl font-semibold mb-4">
                    Edit {purchaseOrder.po_number}
                </h1>

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
                                Supplier
                            </label>
                            <select
                                value={data.supplier_id}
                                onChange={(e) =>
                                    setData("supplier_id", e.target.value)
                                }
                                className="w-full border rounded-md px-2 py-1.5"
                            >
                                <option value="">Select supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.supplier_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Order Date
                            </label>
                            <input
                                type="date"
                                value={data.order_date ?? ""}
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
                                value={data.expected_delivery_date ?? ""}
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
                            value={data.remarks ?? ""}
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
                        />
                        {errors.items && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.items}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <a
                            href={route(
                                "purchase-orders.show",
                                purchaseOrder.id,
                            )}
                            className="px-4 py-2 text-sm rounded-md border"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
