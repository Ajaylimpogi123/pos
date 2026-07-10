import { useState } from "react";

export default function IngredientSelector({
    availableIngredients,
    selected,
    onChange,
}) {
    const [search, setSearch] = useState("");

    const filtered = availableIngredients.filter((i) =>
        i.ing_name.toLowerCase().includes(search.toLowerCase()),
    );

    const addIngredient = (ingredient) => {
        if (selected.find((s) => s.ing_id === ingredient.ing_id)) return;
        onChange([
            ...selected,
            {
                ing_id: ingredient.ing_id,
                ing_name: ingredient.ing_name,
                unit: ingredient.unit,
                pd_ing_qty: 1,
            },
        ]);
    };

    const removeIngredient = (ing_id) => {
        onChange(selected.filter((s) => s.ing_id !== ing_id));
    };

    const updateQty = (ing_id, qty) => {
        onChange(
            selected.map((s) =>
                s.ing_id === ing_id ? { ...s, pd_ing_qty: qty } : s,
            ),
        );
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <input
                type="text"
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
            />

            {/* Available list */}
            <div className="border rounded max-h-40 overflow-y-auto">
                {filtered.map((ing) => (
                    <div
                        key={ing.ing_id}
                        className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => addIngredient(ing)}
                    >
                        <span>
                            {ing.ing_name}{" "}
                            <span className="text-gray-400">({ing.unit})</span>
                        </span>
                        <span className="text-xs text-blue-500">+ Add</span>
                    </div>
                ))}
            </div>

            {/* Selected ingredients */}
            {selected.length > 0 && (
                <table className="w-full text-sm border rounded">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-3 py-2">Ingredient</th>
                            <th className="text-left px-3 py-2">Unit</th>
                            <th className="text-left px-3 py-2">
                                Qty per Product
                            </th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {selected.map((s) => (
                            <tr key={s.ing_id} className="border-t">
                                <td className="px-3 py-2">{s.ing_name}</td>
                                <td className="px-3 py-2">{s.unit}</td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={s.pd_ing_qty}
                                        onChange={(e) =>
                                            updateQty(
                                                s.ing_id,
                                                parseFloat(e.target.value) || 0,
                                            )
                                        }
                                        className="border rounded px-2 py-1 w-24"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeIngredient(s.ing_id)
                                        }
                                        className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
