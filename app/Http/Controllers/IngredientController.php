<?php

namespace App\Http\Controllers;


use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Product;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Storage;
class IngredientController extends Controller
{
  public function index(Request $request)
{
    $search = $request->input('search');

    $ingredients = Ingredient::query()
        ->when($search, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('ing_name', 'like', "%{$search}%");        
            });
        })
        ->orderBy('ing_name', 'asc')
         ->get(); 

    return Inertia::render('Ingredient/Index', [
        'ingredients' => $ingredients,
        'filters' => $request->only(['search']),
    ]);
}



    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'ing_name'        => ['required', 'string', 'max:244'],
            'ing_cost'        => ['required', 'numeric'],
            'unit'        => ['required', 'string', 'max:244'],
              'ing_qty' => ['nullable', 'integer', 'min:0'],
            'ing_mqty' => ['nullable', 'integer', 'min:0'],
           'ing_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'], // 5 MB
        
        ]);

            //handle image upload
            if($request->hasFile('ing_image')){
                $imagePath = $request->file('ing_image')->store('ingredients', 'public');
                $validatedData['ing_image'] = $imagePath;
            }

        $validatedData['branch_id'] = $request->user()->branch_id;
        Ingredient::create($validatedData);
        return redirect('/ingredient')->with('success', 'Ingredient created successfully!');
    }

    public function edit($ing_id): Response
    {
        $ingredients = Ingredient::findOrFail($ing_id);

        return Inertia::render('Ingredient/Edit', [
            'Ingredient' => $ingredients,
        ]);
    }

    public function update(Request $request, $ing_id): RedirectResponse
    {
        $validatedData = $request->validate([
        
            'ing_name'        => ['required', 'string', 'max:244'],
            'ing_cost'        => ['required', 'numeric'],
            'unit'        => ['required', 'string', 'max:244'],
            'ing_qty'         => ['nullable', 'integer', 'min:0'],
            'ing_mqty'        => ['required', 'integer', 'min:0'],
            'ing_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'], // 5 MB
   
        ]);
        
        $ingredient = Ingredient::findOrFail($ing_id);
        
        // Handle image upload
        if ($request->hasFile('ing_image')) {
            // Delete old image if exists
            if ($ingredient->ing_image && Storage::disk('public')->exists($ingredient->ing_image)) {
                Storage::disk('public')->delete($ingredient->ing_image);
            }
            
            // Store new image
            $imagePath = $request->file('ing_image')->store('ingredients', 'public');
            $validatedData['ing_image'] = $imagePath;
        } else {
            // If no new image, we want to KEEP the existing value
            // If the ingredient has no image (null), it stays null
            // If the ingredient has an image, it stays the same
            unset($validatedData['ing_image']);
        }
            // Simple status based on quantity
        $qty = $validatedData['ing_qty'] ?? $ingredient->ing_qty;
        $validatedData['ing_status'] = $qty > 0 ? 'Available' : 'Not Available';

        $ingredient->update($validatedData);
        return redirect('/ingredient')->with('success', 'Ingredient updated successfully!');
    }

    public function destroy($ing_id): RedirectResponse
    {
        $ingredient = Ingredient::findOrFail($ing_id);
        $ingredient->delete();
        return redirect('/ingredient')->with('success', 'Ingredient deleted successfully!');

    }
}
