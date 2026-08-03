// pages/Dashboard.jsx
import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardDescription,
    CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { RecentOrdersTable } from "@/components/recent-orders-table";

// Simple Statistics Cards Component
function StatsCards({ revenue, orders, customers }) {
    const cards = [
        {
            title: "Total Revenue",
            value: `₱${revenue.total.toLocaleString()}`,
            subtext: `₱${revenue.today.toLocaleString()} today`,
            icon: DollarSign,
            trend: revenue.trend,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Total Orders",
            value: orders.total,
            subtext: `${orders.today} orders today`,
            icon: ShoppingBag,
            trend: orders.trend,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Average Order",
            value: `₱${orders.averageValue.toLocaleString()}`,
            subtext: "Per transaction",
            icon: TrendingUp,
            trend: orders.averageTrend,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Customers",
            value: customers.total,
            subtext: `${customers.newToday || 0} new today`,
            icon: Users,
            trend: customers.trend,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card
                    key={index}
                    className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon
                                    className={`h-5 w-5 ${card.color}`}
                                />
                            </div>
                            <Badge
                                variant="outline"
                                className="flex gap-1 bg-white"
                            >
                                {card.trend >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                )}
                                <span
                                    className={
                                        card.trend >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }
                                >
                                    {Math.abs(card.trend)}%
                                </span>
                            </Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">
                                {card.title}
                            </p>
                            <p className={`text-2xl font-bold ${card.color}`}>
                                {card.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.subtext}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Simple Revenue Chart Component
function RevenueChart({ data }) {
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No revenue data for this period.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {data.slice(-7).map((item) => {
                            const height =
                                maxRevenue > 0
                                    ? (item.revenue / maxRevenue) * 100
                                    : 0;
                            return (
                                <div key={item.date} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {format(
                                                parseISO(item.date),
                                                "MMM dd",
                                            )}
                                        </span>
                                        <span className="font-medium text-green-600">
                                            ₱{item.revenue.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-8 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${height}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Simple Payment Methods Chart
function PaymentMethodsChart({ data }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No orders yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {data.map((method, index) => {
                            const percentage =
                                total > 0 ? (method.value / total) * 100 : 0;
                            return (
                                <div key={method.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize">
                                            {method.name}
                                        </span>
                                        <span className="font-medium">
                                            {method.value} orders
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor:
                                                    colors[
                                                        index % colors.length
                                                    ],
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Simple Top Products Chart
function TopProductsChart({ data }) {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling items</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No sales data yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {data.slice(0, 5).map((product, index) => (
                            <div
                                key={product.name}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {product.quantity} sold
                                    </p>
                                </div>
                                <p className="text-sm font-medium text-green-600">
                                    ₱{product.revenue.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Quick Stats Card
function QuickStats({ averageValue, highestOrder, totalItems }) {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                            Average Order Value
                        </span>
                        <span className="text-lg font-bold text-green-600">
                            ₱{averageValue.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                            Highest Order
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                            ₱{highestOrder.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">
                            Total Items Sold
                        </span>
                        <span className="text-lg font-bold text-purple-600">
                            {totalItems.toLocaleString()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const { props } = usePage();
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Data comes from DashboardController::index() — no hardcoded fallbacks,
    // empty defaults instead so a misconfigured prop shows as zero/empty
    // rather than fake-looking sample numbers.
    const orders = props.orders || [];
    const revenueStats = props.revenueStats || { total: 0, today: 0, trend: 0 };
    const customers = props.customers || { total: 0, newToday: 0, trend: 0 };
    const paymentMethods = props.paymentMethods || [];
    const topProducts = props.topProducts || [];
    const orderStatsServer = props.orderStatsServer || {
        trend: 0,
        averageTrend: 0,
    };

    // Filter orders based on date range
    const filteredOrders = useMemo(() => {
        if (!dateRange?.from) return orders;
        return orders.filter((order) => {
            const orderDate = parseISO(order.created_at);
            return (
                orderDate >= startOfDay(dateRange.from) &&
                orderDate <= endOfDay(dateRange.to)
            );
        });
    }, [orders, dateRange]);

    // Calculate daily revenue
    const dailyRevenue = useMemo(() => {
        const revenueMap = new Map();
        filteredOrders.forEach((order) => {
            const date = format(parseISO(order.created_at), "yyyy-MM-dd");
            const revenue = parseFloat(order.od_total_amt_due) || 0;
            revenueMap.set(date, (revenueMap.get(date) || 0) + revenue);
        });
        return Array.from(revenueMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredOrders]);

    // Calculate order statistics — trend/averageTrend come from the server
    // (today vs. yesterday across the FULL dataset), everything else is
    // derived client-side from whatever date range is currently selected.
    const orderStats = useMemo(() => {
        const total = filteredOrders.length;
        const today = filteredOrders.filter(
            (o) =>
                format(parseISO(o.created_at), "yyyy-MM-dd") ===
                format(new Date(), "yyyy-MM-dd"),
        ).length;
        const averageValue =
            total > 0
                ? filteredOrders.reduce(
                      (sum, o) => sum + parseFloat(o.od_total_amt_due),
                      0,
                  ) / total
                : 0;
        return {
            total,
            today,
            averageValue,
            trend: orderStatsServer.trend,
            averageTrend: orderStatsServer.averageTrend,
        };
    }, [filteredOrders, orderStatsServer]);

    // Calculate quick stats
    const quickStats = useMemo(() => {
        const highestOrder = Math.max(
            ...filteredOrders.map((o) => parseFloat(o.od_total_amt_due) || 0),
            0,
        );
        // Sum actual quantities sold, not line-item count — an order with
        // one line "Fried Chicken x5" should count as 5 items, not 1.
        const totalItems = filteredOrders.reduce(
            (sum, o) =>
                sum + (o.items?.reduce((s, i) => s + (i.oi_qty || 0), 0) || 0),
            0,
        );
        return { highestOrder, totalItems };
    }, [filteredOrders]);

    return (
        <AuthenticatedLayout>
            <div className="relative z-10">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground text-white">
                            Welcome back! Here's your business overview.
                        </p>
                    </div>

                    {/* Date Range Picker */}
                    <div className="flex justify-end">
                        <DateRangePicker
                            date={dateRange}
                            setDate={setDateRange}
                        />
                    </div>

                    {/* Stats Cards */}
                    <StatsCards
                        revenue={revenueStats}
                        orders={orderStats}
                        customers={customers}
                    />

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <RevenueChart data={dailyRevenue} />
                        </div>
                        <PaymentMethodsChart data={paymentMethods} />
                    </div>

                    {/* Additional Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopProductsChart data={topProducts} />
                        <QuickStats
                            averageValue={orderStats.averageValue}
                            highestOrder={quickStats.highestOrder}
                            totalItems={quickStats.totalItems}
                        />
                    </div>

                    {/* Recent Orders Table */}
                    <RecentOrdersTable orders={filteredOrders.slice(0, 10)} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
