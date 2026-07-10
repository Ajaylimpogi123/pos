import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Pencil,
    Trash2,
    MoreVertical,
    Package,
    Tag,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import EditModal from "./EditModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 10;
import { router } from "@inertiajs/react";
export default function Card({ children, products, categories, ingredients }) {
    const [currentPage, setCurrentPage] = useState(1);

    const handleDelete = (pd_id) => {
        if (confirm("Are you sure you want to delete this product?")) {
            router.delete(route("product.destroy", pd_id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Product deleted successfully!", {
                        duration: 3000,
                        position: "top-center",
                        classNames: {
                            icon: "text-green-500",
                        },
                    });
                },
            });
        }
    };

    // ── Analytics ────────────────────────────────────────────────────────────
    const analytics = useMemo(() => {
        const total = products.length;
        const totalCats = categories.length;
        const inStock = products.filter((p) => p.pd_qty > p.pd_mqty).length;
        const lowStock = products.filter(
            (p) => p.pd_qty > 0 && p.pd_qty <= p.pd_mqty,
        ).length;
        const outOfStock = products.filter((p) => p.pd_qty === 0).length;
        // Fast moving  → stock ≤ 2× threshold (sells through quickly)
        const fastMoving = products.filter(
            (p) => p.pd_qty > 0 && p.pd_qty <= p.pd_mqty * 2,
        ).length;
        // Slow moving  → stock > 5× threshold (accumulates, sells slowly)
        const slowMoving = products.filter(
            (p) => p.pd_qty > p.pd_mqty * 5,
        ).length;
        return {
            total,
            totalCats,
            inStock,
            lowStock,
            outOfStock,
            fastMoving,
            slowMoving,
        };
    }, [products, categories]);

    // ── Moving status + days left per product ────────────────────────────────
    // "Days Left" needs pd_avg_daily_sales from your DB (units sold per day).
    // Fallback: heuristic from qty vs threshold ratio.
    const getMoving = (p) => {
        if (p.pd_qty === 0) return { type: "out", daysLeft: 0 };
        if (p.pd_avg_daily_sales > 0) {
            const daysLeft = Math.floor(p.pd_qty / p.pd_avg_daily_sales);
            return {
                type:
                    daysLeft < 30 ? "fast" : daysLeft > 90 ? "slow" : "normal",
                daysLeft,
            };
        }
        const ratio = p.pd_qty / (p.pd_mqty || 1);
        if (ratio <= 2) return { type: "fast", daysLeft: null };
        if (ratio > 5) return { type: "slow", daysLeft: null };
        return { type: "normal", daysLeft: null };
    };

    // ── Pagination ───────────────────────────────────────────────────────────
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(start, start + ITEMS_PER_PAGE);
    const end = Math.min(start + ITEMS_PER_PAGE, products.length);

    // ── Stat card helper ─────────────────────────────────────────────────────
    const StatCard = ({
        icon: Icon,
        iconBg,
        iconColor,
        label,
        value,
        valueColor,
        sub,
    }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 ${iconBg} rounded-md`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                </div>
                <span className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">
                    {label}
                </span>
            </div>
            <div
                className={`text-2xl font-bold ${valueColor ?? "text-gray-900"}`}
            >
                {value}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
        </div>
    );

    return (
        <div className="rounded-sm bg-card text-card-foreground">
            {/* ── Analytics Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                <StatCard
                    icon={Package}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    label="Products"
                    value={analytics.total}
                    sub="total items"
                />
                <StatCard
                    icon={Tag}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    label="Categories"
                    value={analytics.totalCats}
                    sub="total groups"
                />
                <StatCard
                    icon={CheckCircle}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label="In Stock"
                    value={analytics.inStock}
                    valueColor="text-green-600"
                    sub="above threshold"
                />
                <StatCard
                    icon={AlertTriangle}
                    iconBg="bg-yellow-50"
                    iconColor="text-yellow-600"
                    label="Low Stock"
                    value={analytics.lowStock}
                    valueColor="text-yellow-600"
                    sub="at/below threshold"
                />
                <StatCard
                    icon={XCircle}
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                    label="Out of Stock"
                    value={analytics.outOfStock}
                    valueColor="text-red-600"
                    sub="needs restocking"
                />
            </div>

            {/* ── Product Cards ───────────────────────────────────────────── */}
            <div>
                {paginatedProducts.map((product) => {
                    const moving = getMoving(product);
                    return (
                        <div
                            key={product.pd_id}
                            className="bg-white rounded-md shadow-sm border border-gray-200 p-2 mb-2 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Image */}
                                <div className="lg:w-[100px] shrink-0">
                                    <div className="relative aspect-square w-full max-w-[100px] mx-auto lg:mx-0">
                                        {product.pd_image ? (
                                            <img
                                                src={`storage/${product.pd_image}`}
                                                alt={product.pd_name}
                                                className="rounded-md object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-md bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                                <svg
                                                    className="w-10 h-10 text-gray-300"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm px-1 py-0.5 rounded text-xs font-semibold">
                                            {product.pd_qty} left
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    {product.pd_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    — {product.pd_description}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                Category:{" "}
                                                {product.category?.cat_name ||
                                                    "N/A"}
                                            </div>
                                        </div>

                                        {/* Moving badge + menu */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {moving.type === "fast" && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                                                    <TrendingUp className="h-3 w-3" />{" "}
                                                    Fast
                                                </span>
                                            )}
                                            {moving.type === "slow" && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                                                    <TrendingDown className="h-3 w-3" />{" "}
                                                    Slow
                                                </span>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel className="text-xs">
                                                        Actions
                                                    </DropdownMenuLabel>
                                                    <EditModal
                                                        product={product}
                                                        categories={categories}
                                                        ingredients={
                                                            ingredients
                                                        }
                                                    >
                                                        <div className="bg-indigo-50 text-indigo-700 text-xs hover:bg-indigo-100 pl-2 pr-4 py-1.5 rounded-md cursor-pointer flex items-center gap-2 mt-1.5">
                                                            <Pencil className="h-3.5 w-3.5" />{" "}
                                                            Edit
                                                        </div>
                                                    </EditModal>
                                                    <div
                                                        className="bg-red-50 text-red-700 text-xs hover:bg-red-100 pl-2 pr-4 py-1.5 rounded-md cursor-pointer flex items-center gap-2 mt-1.5"
                                                        onClick={() =>
                                                            handleDelete(
                                                                product.pd_id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />{" "}
                                                        Delete
                                                    </div>
                                                    <DropdownMenuItem />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-1">
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Price
                                            </div>
                                            <div className="text-sm font-semibold text-green-600">
                                                ₱{product.pd_price}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                All Stock
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {product.pd_qty} pcs
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Cost
                                            </div>
                                            <div className="text-sm font-semibold">
                                                ₱{product.pd_cost}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Threshold
                                            </div>
                                            <div className="text-sm">
                                                {product.pd_mqty} pcs
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Days Left
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {moving.daysLeft != null ? (
                                                    <span
                                                        className={
                                                            moving.daysLeft < 7
                                                                ? "text-red-600"
                                                                : moving.daysLeft <
                                                                    30
                                                                  ? "text-yellow-600"
                                                                  : "text-green-600"
                                                        }
                                                    >
                                                        {moving.daysLeft}d
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">
                                                        no data
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Status
                                            </div>
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                                                ${
                                                    product.pd_qty === 0
                                                        ? "bg-red-100 text-red-800"
                                                        : product.pd_qty <=
                                                            product.pd_mqty
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : "bg-green-100 text-green-800"
                                                }`}
                                            >
                                                {product.pd_qty === 0
                                                    ? "Out of Stock"
                                                    : product.pd_qty <=
                                                        product.pd_mqty
                                                      ? "Low Stock"
                                                      : "In Stock"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    Showing {products.length === 0 ? 0 : start + 1}–{end} of{" "}
                    {products.length} results
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={
                            currentPage === totalPages || totalPages === 0
                        }
                    >
                        Next
                    </Button>
                </div>
            </div>

            <div>{children}</div>
        </div>
    );
}
