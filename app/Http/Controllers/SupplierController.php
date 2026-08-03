<?php

namespace App\Http\Controllers;


use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Supplier;
use Illuminate\Support\Facades\Storage;
class SupplierController extends Controller
{
    public function index(Request $request)
{
    $search = $request->input('search');

    $suppliers = Supplier::query()
        ->when($search, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('supplier_name', 'like', "%{$search}%");        
            });
        })
        ->orderBy('id', 'asc')
         ->get();

    return Inertia::render('Supplier/Index', [
        'suppliers' => $suppliers,
        'filters' => $request->only(['search']),
    ]);
}


    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'supplier_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

            //handle image upload
            if($request->hasFile('cat_image')){
                $imagePath = $request->file('cat_image')->store('categories', 'public');
                $validatedData['cat_image'] = $imagePath;
            }
            
    
        Supplier::create($validatedData);
        return redirect('/supplier')->with('success', 'Supplier created successfully!');
    }



    public function update(Request $request, $id): RedirectResponse
    {
        $validatedData = $request->validate([
            'supplier_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);
        
   
        $supplier = Supplier::findOrFail($id);
      // Handle image upload
    if ($request->hasFile('cat_image')) {
        // Delete old image if exists
        if ($supplier->cat_image && Storage::disk('public')->exists($supplier->cat_image)) {
            Storage::disk('public')->delete($supplier->cat_image);
        }
        
        // Store new image
        $imagePath = $request->file('cat_image')->store('categories', 'public');
        $validatedData['cat_image'] = $imagePath;
    } else {
        // Keep existing image
        unset($validatedData['cat_image']);
    }

            $supplier->update($validatedData);
            return redirect('/supplier')->with('success', 'Supplier updated successfully!');
    }

    public function destroy($id): RedirectResponse
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();
        return redirect('/supplier')->with('success', 'Supplier deleted successfully!');
    }
}
