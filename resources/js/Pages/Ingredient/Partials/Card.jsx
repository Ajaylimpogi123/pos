import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Pencil,
    Trash2,
    MoreVertical,
    FlaskConical,
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
import { router } from "@inertiajs/react";
const ITEMS_PER_PAGE = 10;

export default function Card({ children, ingredients }) {
    const [currentPage, setCurrentPage] = useState(1);

    const handleDelete = (ing_id) => {
        if (confirm("Are you sure you want to delete this ingredient?")) {
            router.delete(route("ingredient.destroy", ing_id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Ingredient deleted successfully!", {
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
        const total = ingredients.length;
        const inStock = ingredients.filter(
            (i) => i.ing_qty > i.ing_mqty,
        ).length;
        const lowStock = ingredients.filter(
            (i) => i.ing_qty > 0 && i.ing_qty <= i.ing_mqty,
        ).length;
        const outOfStock = ingredients.filter((i) => i.ing_qty === 0).length;
        // Fast moving  → stock ≤ 2× threshold (used up quickly)
        const fastMoving = ingredients.filter(
            (i) => i.ing_qty > 0 && i.ing_qty <= i.ing_mqty * 2,
        ).length;
        // Slow moving  → stock > 5× threshold (barely used)
        const slowMoving = ingredients.filter(
            (i) => i.ing_qty > i.ing_mqty * 5,
        ).length;
        return { total, inStock, lowStock, outOfStock, fastMoving, slowMoving };
    }, [ingredients]);

    // ── Moving status + days left per ingredient ─────────────────────────────
    // Days Left needs ing_avg_daily_usage from your DB (units used per day).
    // Fallback: heuristic from qty vs threshold ratio.
    const getMoving = (i) => {
        if (i.ing_qty === 0) return { type: "out", daysLeft: 0 };
        if (i.ing_avg_daily_usage > 0) {
            const daysLeft = Math.floor(i.ing_qty / i.ing_avg_daily_usage);
            return {
                type:
                    daysLeft < 30 ? "fast" : daysLeft > 90 ? "slow" : "normal",
                daysLeft,
            };
        }
        const ratio = i.ing_qty / (i.ing_mqty || 1);
        if (ratio <= 2) return { type: "fast", daysLeft: null };
        if (ratio > 5) return { type: "slow", daysLeft: null };
        return { type: "normal", daysLeft: null };
    };

    // ── Pagination ───────────────────────────────────────────────────────────
    const totalPages = Math.ceil(ingredients.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedIngredients = ingredients.slice(
        start,
        start + ITEMS_PER_PAGE,
    );
    const end = Math.min(start + ITEMS_PER_PAGE, ingredients.length);

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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                <StatCard
                    icon={FlaskConical}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    label="Ingredients"
                    value={analytics.total}
                    sub="total items"
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
                {/* <StatCard
                    icon={TrendingUp}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                    label="Fast Usage"
                    value={analytics.fastMoving}
                    valueColor="text-indigo-600"
                    sub="≤ 2× threshold"
                />
                <StatCard
                    icon={TrendingDown}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                    label="Slow Usage"
                    value={analytics.slowMoving}
                    valueColor="text-orange-600"
                    sub="> 5× threshold"
                /> */}
            </div>

            {/* ── Ingredient Cards ────────────────────────────────────────── */}
            <div>
                {paginatedIngredients.map((ingredient) => {
                    const moving = getMoving(ingredient);
                    return (
                        <div
                            key={ingredient.ing_id}
                            className="bg-white rounded-md shadow-sm border border-gray-200 p-2 mb-2 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Image */}
                                <div className="lg:w-[100px] shrink-0">
                                    <div className="relative aspect-square w-full max-w-[100px] mx-auto lg:mx-0">
                                        {ingredient.ing_image ? (
                                            <img
                                                src={`storage/${ingredient.ing_image}`}
                                                alt={ingredient.ing_name}
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
                                            {ingredient.ing_qty} left
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">
                                            {ingredient.ing_name}
                                        </h3>

                                        {/* Usage badge + menu */}
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
                                                        ingredient={ingredient}
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
                                                                ingredient.ing_id,
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
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-1">
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                All Stock
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {ingredient.ing_qty}{" "}
                                                {ingredient.unit}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Cost
                                            </div>
                                            <div className="text-sm font-semibold">
                                                ₱{ingredient.ing_cost}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                Threshold
                                            </div>
                                            <div className="text-sm">
                                                {ingredient.ing_mqty}{" "}
                                                {ingredient.unit}
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
                                                    ingredient.ing_qty === 0
                                                        ? "bg-red-100 text-red-800"
                                                        : ingredient.ing_qty <=
                                                            ingredient.ing_mqty
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : "bg-green-100 text-green-800"
                                                }`}
                                            >
                                                {ingredient.ing_qty === 0
                                                    ? "Out of Stock"
                                                    : ingredient.ing_qty <=
                                                        ingredient.ing_mqty
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
                    Showing {ingredients.length === 0 ? 0 : start + 1}–{end} of{" "}
                    {ingredients.length} results
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
