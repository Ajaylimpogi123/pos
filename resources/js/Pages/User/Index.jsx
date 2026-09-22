import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddModal from "./Partials/AddModal";
import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";

import Card from "./Partials/Card";
export default function Index({ users, filters, roles }) {
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
            route("user.index"),
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["users", "filters"],
            },
        );
    };

    const handleCategoryChange = (value) => {
        setData("search", value);
        router.get(
            route("user.index"),
            { search: data.search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["users", "filters"],
            },
        );
    };

    const clearSearch = () => {
        setData("search", "");
        router.get(
            route("user.index"),
            { search: "" },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["users", "filters"],
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Contact Page" />

            <div className="relative z-10 py-8">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 text-white">
                                    User
                                </h1>
                                <p className="mt-2 text-sm text-gray-600 text-white">
                                    Manage your users and organization
                                </p>
                            </div>
                            <AddModal roles={roles}>
                                {" "}
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add User
                                </Button>
                            </AddModal>
                        </div>
                    </div>

                    {/* Content Section */}

                    {/* Search and Filters */}
                    <div className="flex  flex-col gap-2 md:flex-row md:items-center ">
                        <div className="relative w-full md:w-96 mb-6">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                value={data.search}
                                onChange={handleSearch}
                                placeholder="Search User..."
                                className="pl-9 pr-9 bg-white"
                            />

                            {/* Clear Button */}
                            {data.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearSearch}
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Content Grid */}
                    <Card users={users} roles={roles} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
