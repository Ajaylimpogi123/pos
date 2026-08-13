import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ItemsEditor from "./Partials/ItemsEditor";

export default function CreateRequest({ branches, ingredients, suppliers }) {
    console.log("ingredients", ingredients);
    const { data, setData, post, processing, errors } = useForm({
        branch_id: "",
        date_needed: "",
        remarks: "",
        items: [
            {
                ingredient_id: "",
                supplier_id: "",
                item_name: "",
                unit: "",
                quantity: 1,
                estimated_unit_price: "",
            },
        ],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("purchase-requests.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Purchase Request" />

            <div className="p-4 md:p-6 relative z-10">
                <h1 className="text-xl font-semibold mb-4">
                    New Purchase Request
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
                                Date Needed
                            </label>
                            <input
                                type="date"
                                value={data.date_needed}
                                onChange={(e) =>
                                    setData("date_needed", e.target.value)
                                }
                                className="w-full border rounded-md px-2 py-1.5"
                            />
                            {errors.date_needed && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.date_needed}
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
                            suppliers={suppliers}
                            priceField="estimated_unit_price"
                            priceLabel="Est. Unit Price"
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
                            {processing ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
