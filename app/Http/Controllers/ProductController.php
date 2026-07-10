<?php

namespace App\Http\Controllers;


use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Storage;
class ProductController extends Controller
{
    public function index(Request $request)
{

 $search = $request->input('search');
$category = $request->input('category');
 
 $products = Product::with(['category', 'ingredients']) // Eager load category
          ->when($search, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('pd_name', 'like', "%{$search}%")
                      ->orWhere('pd_description', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($query) use ($search){
                        $query->where('cat_name', 'like', "%{$search}%");
                      });   
            });
        })
        ->when($category && $category !== 'all', function ($query) use ($category) {
            $query->where('cat_id', $category);
        })
     
        
        ->orderBy('created_at', 'desc')
        ->get();

    $categories = Category::orderBy('cat_name', 'asc')
        ->get(['cat_id', 'cat_name']);

        $ingredients = Ingredient::orderBy('ing_name', 'asc')
        ->get(['ing_id', 'ing_name', 'unit']);

    return Inertia::render('Product/Index', [
        'products' => $products,
        'filters' => $request->only(['search', 'category']),
        'categories' => $categories, // Make sure this is included
        'ingredients' => $ingredients,
    ]);
}

    public function create(): Response
    {
        return Inertia::render('Product/Create');
    }

   public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'cat_id'         => ['required', 'integer', 'exists:tbl_category,cat_id'],
        'pd_name'        => ['required', 'string', 'max:244'],
        'pd_description' => ['nullable', 'string'],
        'pd_cost'        => ['required', 'numeric'],
        'pd_price'       => ['required', 'numeric'],
        'pd_qty'         => ['nullable', 'integer', 'min:0'],
        'pd_mqty'        => ['nullable', 'integer', 'min:0'],
        'pd_image'       => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        'ingredients'    => ['nullable', 'array'],
        'ingredients.*.ing_id'    => ['required', 'integer', 'exists:tbl_ingredient,ing_id'],
        'ingredients.*.pd_ing_qty'=> ['required', 'numeric', 'min:0'],
    ]);

    if ($request->hasFile('pd_image')) {
        $validated['pd_image'] = $request->file('pd_image')->store('products', 'public');
    }

    $qty = $validated['pd_qty'] ?? 0;
    $validated['pd_status'] = $qty > 0 ? 'Available' : 'Not Available';

    $product = Product::create($validated);

    // Sync ingredients
    if (!empty($validated['ingredients'])) {
        $syncData = collect($validated['ingredients'])
            ->keyBy('ing_id')
            ->map(fn($i) => ['pd_ing_qty' => $i['pd_ing_qty']])
            ->toArray();
        $product->ingredients()->sync($syncData);
    }

    return redirect('/product')->with('success', 'Product created successfully!');
}


    public function edit($pd_id): Response
    {
        $products = Product::findOrFail($pd_id);

        return Inertia::render('Product/Edit', [
            'Product' => $products,
        ]);
    }

   public function update(Request $request, $pd_id): RedirectResponse
{
    $validated = $request->validate([
        'cat_id'         => ['required', 'integer', 'exists:tbl_category,cat_id'],
        'pd_name'        => ['required', 'string', 'max:244'],
        'pd_description' => ['nullable', 'string'],
        'pd_cost'        => ['required', 'numeric'],
        'pd_price'       => ['required', 'numeric'],
        'pd_qty'         => ['nullable', 'integer', 'min:0'],
        'pd_mqty'        => ['required', 'integer', 'min:0'],
        'pd_image'       => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        'ingredients'    => ['nullable', 'array'],
        'ingredients.*.ing_id'    => ['required', 'integer', 'exists:tbl_ingredient,ing_id'],
        'ingredients.*.pd_ing_qty'=> ['required', 'numeric', 'min:0'],
    ]);

    $product = Product::findOrFail($pd_id);

    if ($request->hasFile('pd_image')) {
        if ($product->pd_image && Storage::disk('public')->exists($product->pd_image)) {
            Storage::disk('public')->delete($product->pd_image);
        }
        $validated['pd_image'] = $request->file('pd_image')->store('products', 'public');
    } else {
        unset($validated['pd_image']);
    }

    $qty = $validated['pd_qty'] ?? $product->pd_qty;
    $validated['pd_status'] = $qty > 0 ? 'Available' : 'Not Available';

    $product->update($validated);

    // Sync ingredients (replaces old ones)
    $syncData = collect($validated['ingredients'] ?? [])
        ->keyBy('ing_id')
        ->map(fn($i) => ['pd_ing_qty' => $i['pd_ing_qty']])
        ->toArray();
    $product->ingredients()->sync($syncData);

    return redirect('/product')->with('success', 'Product updated successfully!');
}

    public function destroy($pd_id): RedirectResponse
    {
        $product = Product::findOrFail($pd_id);
        $product->delete();
        return redirect('/product')->with('success', 'Delete');

    }
}
