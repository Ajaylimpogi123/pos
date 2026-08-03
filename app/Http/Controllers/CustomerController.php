<?php

namespace App\Http\Controllers;


use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Customer;
use Illuminate\Support\Facades\Storage;
class CustomerController extends Controller
{
    public function index(Request $request)
{
    $search = $request->input('search');

    $customers = Customer::query()
        ->when($search, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('cust_fname', 'like', "%{$search}%")
                      ->orWhere('cust_lname', 'like', "%{$search}%");   
            });
        })
        ->orderBy('cust_id', 'asc')
         ->get();

    return Inertia::render('Customer/Index', [
        'customers' => $customers,
        'filters' => $request->only(['search']),
    ]);
}



    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'cust_fname' => ['required', 'string', 'max:255'],
            'cust_lname' => ['required', 'string', 'max:255'],
            'cust_contact' => ['required', 'string', 'max:255'],
            'cust_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

            //handle image upload
            if($request->hasFile('cust_image')){
                $imagePath = $request->file('cust_image')->store('customers', 'public');
                $validatedData['cust_image'] = $imagePath;
            }
            
    
        Customer::create($validatedData);
        return redirect('/customer')->with('success', 'Customer created successfully!');
    }



    public function update(Request $request, $cust_id): RedirectResponse
    {
        $validatedData = $request->validate([
            'cust_fname' => ['required', 'string', 'max:255'],
            'cust_lname' => ['required', 'string', 'max:255'],
            'cust_contact' => ['required', 'string', 'max:255'],
            'cust_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);
        
   
        $customer = Customer::findOrFail($cust_id);
      // Handle image upload
    if ($request->hasFile('cust_image')) {
        // Delete old image if exists
        if ($customer->cust_image && Storage::disk('public')->exists($customer->cust_image)) {
            Storage::disk('public')->delete($customer->cust_image);
        }
        
        // Store new image
        $imagePath = $request->file('cust_image')->store('customers', 'public');
        $validatedData['cust_image'] = $imagePath;
    } else {
        // Keep existing image
        unset($validatedData['cust_image']);
    }

            $customer->update($validatedData);
            return redirect('/customer')->with('success', 'Customer updated successfully!');
    }

    public function destroy($cust_id): RedirectResponse
    {
        $customer = Customer::findOrFail($cust_id);
        $customer->delete();
        return redirect('/customer')->with('success', 'Customer deleted successfully!');
    }
}
