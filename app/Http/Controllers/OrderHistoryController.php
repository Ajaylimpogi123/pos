<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderHistoryController extends Controller
{
    public function index(Request $request)
    {

        $orders = Order::with('customer')
            ->orderBy('od_id', 'desc')
            ->get();

        return Inertia::render('History/Index', [
            'orders' => $orders,
        ]);
    }
}
