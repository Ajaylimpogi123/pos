<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\IngredientConversion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class IngredientConversionController extends Controller
{
    /**
     * Save (or update) a custom conversion for one ingredient.
     * `to_unit` is always forced to the ingredient's own stock unit — a
     * custom conversion only ever needs to answer "how much of MY stock
     * unit does one `from_unit` represent for THIS ingredient".
     */
    public function store(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $request->validate([
            'from_unit' => ['required', 'string', 'max:50'],
            'factor'    => ['required', 'numeric', 'gt:0'],
        ]);

        if (strcasecmp($validated['from_unit'], $ingredient->unit) === 0) {
            return redirect()->back()->withErrors([
                'from_unit' => 'That already is this ingredient\'s stock unit.',
            ]);
        }

        IngredientConversion::updateOrCreate(
            [
                'ing_id'    => $ingredient->ing_id,
                'from_unit' => $validated['from_unit'],
            ],
            [
                'to_unit' => $ingredient->unit,
                'factor'  => $validated['factor'],
            ],
        );

        return redirect()->back()->with('success', 'Conversion saved.');
    }

    public function destroy(IngredientConversion $conversion): RedirectResponse
    {
        $conversion->delete();

        return redirect()->back()->with('success', 'Conversion removed.');
    }
}