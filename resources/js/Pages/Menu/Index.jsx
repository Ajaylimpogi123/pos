import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import React from "react";

import CardTable from "./Partials/CardTable";

export default function Index({ tables, table_ids, table_item_counts }) {
    return (
        <AuthenticatedLayout>
            <Head title="Contact Page" />

            <div className="relative z-10 py-8">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    Choose Table
                                </h1>
                                <p className="mt-2 text-sm text-white">
                                    Select Vacant Table for orders
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* { Content CartTable} */}
                    <CardTable
                        tables={tables}
                        table_ids={table_ids}
                        table_item_counts={table_item_counts}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
