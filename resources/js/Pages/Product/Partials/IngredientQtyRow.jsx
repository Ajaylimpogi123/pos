// Place at: resources/js/Pages/Product/Partials/IngredientQtyRow.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { convertQty } from "@/Components/unitConversion";
import UnitSearchSelect from "@/Components/UnitSearchSelect";

/**
 * One row in the "selected ingredients" table of the recipe builder.
 *
 * Lets the user enter the recipe quantity in ANY unit from the full unit
 * catalog (searchable, grouped) — not just units in the same physical
 * family as the ingredient's stock unit. Conversion is attempted via
 * convertQty, which checks:
 *   1. ingredient-specific custom conversions (see IngredientConversionModal)
 *   2. automatic same-family conversion (mass/volume/count)
 * If neither applies, the row shows a "can't convert" warning instead of
 * silently guessing — prompting the user to add a custom conversion for
 * that ingredient if they really need that unit.
 *
 * Only the *converted* quantity — expressed in the ingredient's own stock
 * unit — is ever sent up via onQtyChange, so nothing else in the app
 * (validation, pivot table, stock deduction) needs to change.
 */
export default function IngredientQtyRow({ ing, onQtyChange, onRemove }) {
    const [inputQty, setInputQty] = useState(ing.pd_ing_qty ?? 1);
    const [inputUnit, setInputUnit] = useState(ing.unit);

    // Eager-loaded from the backend as the `conversions` relation on each
    // ingredient (see ProductController::index).
    const customConversions = ing.conversions ?? [];

    const converted = convertQty(
        parseFloat(inputQty) || 0,
        inputUnit,
        ing.unit,
        customConversions,
    );

    useEffect(() => {
        onQtyChange(ing.ing_id, converted ?? (parseFloat(inputQty) || 0));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputQty, inputUnit]);

    return (
        <tr className="hover:bg-muted/40">
            <td className="px-3 py-2 font-medium">{ing.ing_name}</td>
            <td className="px-3 py-2 text-muted-foreground">{ing.unit}</td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={inputQty}
                        onChange={(e) => setInputQty(e.target.value)}
                        className="w-20 h-8"
                    />
                    <UnitSearchSelect
                        value={inputUnit}
                        onChange={setInputUnit}
                        compact
                    />
                </div>

                {converted !== null && inputUnit !== ing.unit && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        = {converted.toFixed(2)} {ing.unit} deducted
                    </p>
                )}
                {converted === null && (
                    <p className="text-[11px] text-red-500 mt-0.5">
                        Can't convert {inputUnit} → {ing.unit}. Add a custom
                        conversion for this ingredient first.
                    </p>
                )}
            </td>
            <td className="px-3 py-2">
                <button
                    type="button"
                    onClick={() => onRemove(ing.ing_id)}
                    className="text-destructive hover:text-destructive/80"
                >
                    <X className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}
