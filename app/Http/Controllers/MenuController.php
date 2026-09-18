<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;

class MenuController extends Controller
{
    public function menu(Request $request): Response
    {
        $categories = Category::with('products')
            ->orderBy('cat_id', 'asc')
            ->get();

        $search = $request->input('search');

        $products = Product::select('pd_id', 'cat_id', 'pd_name', 'pd_description', 'pd_price', 'pd_image', 'pd_qty', 'pd_mqty', 'pd_status')
            ->when($search, fn($query) =>
                $query->where(fn($q) =>
                    $q->where('pd_name', 'like', "%{$search}%")
                      ->orWhere('pd_description', 'like', "%{$search}%")
                )
            )
            ->orderBy('pd_name', 'asc')
            ->get();

        $cartItems = Cart::with('product:pd_id,pd_name,pd_price,pd_image,cat_id')
            ->get()
            ->map(fn($cart) => [
                'pd_id' => $cart->pd_id,
                'cat_id' => $cart->product?->cat_id,
                'ct_id' => $cart->ct_id,
                'pd_name' => $cart->product?->pd_name,
                'pd_price' => $cart->product?->pd_price ?? 0,
                'ct_qty' => $cart->ct_qty,
                'ct_printed_qty' => $cart->ct_printed_qty,
                'pd_image' => $cart->product?->pd_image,
            ]);

        return Inertia::render('Menu/Menu', [
            'categories' => $categories,
            'products' => $products,
            'cartItems' => $cartItems,
            'cartItemsCount' => $cartItems->sum('ct_qty'),
            'filters' => $request->only(['search']),
            'flash' => [
                'success' => session('success'),
                'order' => session('order'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'pd_id'    => 'required|integer',
            'ct_qty'   => 'required|numeric|min:1',
            'ct_price' => 'required|numeric',
        ]);

        $cart = Cart::where('pd_id', $validatedData['pd_id'])->first();

        if ($cart) {
            $cart->increment('ct_qty', $validatedData['ct_qty']);
        } else {
            Cart::create($validatedData);
        }

        return redirect()->route('menu.menu')->with('success', 'Item added to cart.');
    }

    public function destroy($cart)
    {
        $cart = Cart::find($cart);

        if (!$cart) {
            return redirect()->back()->with('error', 'Cart item not found');
        }

        $cart->delete();

        return redirect()->back()->with('success', 'Item removed from cart successfully');
    }

    public function update(Request $request, Cart $cart)
    {
        try {
            $validated = $request->validate([
                'ct_qty' => 'required|integer|min:1|max:99',
            ]);

            $cart->update(['ct_qty' => $validated['ct_qty']]);

            return redirect()->back()->with('success', 'Cart updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update cart');
        }
    }
}