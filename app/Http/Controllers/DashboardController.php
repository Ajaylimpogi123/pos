<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // 90-day window feeds the client-side date-range picker without
        // shipping the entire orders history on every page load.
        $windowStart = Carbon::today()->subDays(90)->startOfDay();

        $orders = Order::with('items.products')
            ->where('created_at', '>=', $windowStart)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => [
                'od_id' => $order->od_id,
                'invoice_no' => $order->invoice_no,
              'queue_no' => $order->queue_no,
                'payment_method' => $order->payment_method,
                'od_total_amt_due' => (float) $order->od_total_amt_due,
                'created_at' => $order->created_at->toIso8601String(),
                'items' => $order->items->map(fn($item) => [
                    'pd_name' => $item->products->pd_name ?? 'Item',
                    'oi_qty' => (int) $item->oi_qty,
                    'oi_price' => (float) $item->oi_price,
                ]),
            ]);

        // --- Revenue ---
        $totalRevenue = (float) Order::sum('od_total_amt_due');
        $todayRevenue = (float) Order::whereDate('created_at', $today)->sum('od_total_amt_due');
        $yesterdayRevenue = (float) Order::whereDate('created_at', $yesterday)->sum('od_total_amt_due');

        $revenueTrend = $yesterdayRevenue > 0
            ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
            : ($todayRevenue > 0 ? 100 : 0);

        // --- Orders ---
        $totalOrders = Order::count();
        $todayOrders = Order::whereDate('created_at', $today)->count();
        $yesterdayOrders = Order::whereDate('created_at', $yesterday)->count();

        $orderTrend = $yesterdayOrders > 0
            ? round((($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100, 1)
            : ($todayOrders > 0 ? 100 : 0);

        $averageOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $todayAverage = $todayOrders > 0 ? $todayRevenue / $todayOrders : 0;
        $yesterdayAverage = $yesterdayOrders > 0 ? $yesterdayRevenue / $yesterdayOrders : 0;
        $averageTrend = $yesterdayAverage > 0
            ? round((($todayAverage - $yesterdayAverage) / $yesterdayAverage) * 100, 1)
            : 0;

        // --- Customers ---
        $totalCustomers = Customer::count();
        $newCustomersToday = Customer::whereDate('created_at', $today)->count();
        $newCustomersYesterday = Customer::whereDate('created_at', $yesterday)->count();

        $customerTrend = $newCustomersYesterday > 0
            ? round((($newCustomersToday - $newCustomersYesterday) / $newCustomersYesterday) * 100, 1)
            : ($newCustomersToday > 0 ? 100 : 0);

        // --- Payment methods ---
        $paymentMethods = Order::select('payment_method', DB::raw('count(*) as value'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn($row) => [
                'name' => $row->payment_method ?: 'unknown',
                'value' => $row->value,
            ]);

        // --- Top products (raw query builder — doesn't assume any
        // Eloquent relation names I haven't confirmed from your models) ---
        $topProducts = DB::table('tbl_order_items')
            ->join('tbl_order', 'tbl_order.od_id', '=', 'tbl_order_items.od_id')
            ->join('tbl_product', 'tbl_product.pd_id', '=', 'tbl_order_items.pd_id')
            ->where('tbl_order.created_at', '>=', $windowStart)
            ->select('tbl_product.pd_name')
            ->selectRaw('SUM(tbl_order_items.oi_qty) as quantity')
            ->selectRaw('SUM(tbl_order_items.oi_qty * tbl_order_items.oi_price) as revenue')
            ->groupBy('tbl_product.pd_id', 'tbl_product.pd_name')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get()
            ->map(fn($row) => [
                'name' => $row->pd_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (float) $row->revenue,
            ]);

        return Inertia::render('Dashboard', [
            'orders' => $orders,
            'revenueStats' => [
                'total' => $totalRevenue,
                'today' => $todayRevenue,
                'trend' => $revenueTrend,
            ],
            'customers' => [
                'total' => $totalCustomers,
                'newToday' => $newCustomersToday,
                'trend' => $customerTrend,
            ],
            'paymentMethods' => $paymentMethods,
            'topProducts' => $topProducts,
            'orderStatsServer' => [
                'trend' => $orderTrend,
                'averageTrend' => $averageTrend,
            ],
        ]);
    }
}