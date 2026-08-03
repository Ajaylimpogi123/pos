import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Edit, Search } from "lucide-react";
import AddModal from "./Partials/AddModal";
import React from "react";
import { DataTable } from "./Partials/DataTable";
import { columns } from "./Partials/Columns";
export default function Index({ customers, filters }) {
    const customerData =
        customers.map((customer) => ({
            cust_id: customer.cust_id,
            cust_fname: customer.cust_fname,
            cust_lname: customer.cust_lname,
            cust_contact: customer.cust_contact,
            cust_image: customer.cust_image,
        })) || [];

    const {
        data,
        setData,
        delete: destroy,
        processing,
    } = useForm({
        search: filters.search || "",
    });

    // Debounced search function
    const handleSearch = (e) => {
        const value = e.target.value;
        setData("search", value);

        router.get(
            route("customer.index"),
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["customers", "filters"],
            },
        );
    };

    const clearSearch = () => {
        setData("search", "");
        router.get(
            route("customer.index"),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleDelete = (cust_id) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            destroy(route("customer.destroy", cust_id), {
                preserveScroll: true,
                onSuccess: () => {
                    // Optional: Show success message
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Contact Page" />

            <div className="relative z-10 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    Customers
                                </h1>
                                <p className="mt-2 text-sm text-white">
                                    Manage your customer information and
                                    relationships
                                </p>
                            </div>

                            {/* Add Customer Button */}
                            <AddModal>
                                {" "}
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Customer
                                </Button>
                            </AddModal>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="rounded-sm border bg-card text-card-foreground shadow">
                        <div className="p-6">
                            <DataTable
                                columns={columns}
                                data={customerData}
                                searchable={true}
                                pagination={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
