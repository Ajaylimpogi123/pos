import SearchableSelect from "./SearchableSelect";
import { UNIT_OPTIONS } from "../unitOptions";

/**
 * Reusable line-items editor for Purchase Request / Purchase Order forms.
 *
 * props:
 *  - items: array of { ingredient_id, item_name, unit, quantity, [priceField] }
 *  - onChange: (items) => void
 *  - ingredients: [{ ing_id, ing_name }] for the ingredient dropdown
 *  - priceField: 'estimated_unit_price' (PR) or 'unit_price' (PO)
 *  - priceLabel: display label for the price column
 */
export default function ItemsEditor({
    items,
    onChange,
    ingredients = [],
    suppliers = [],
    priceField,
    priceLabel,
}) {
    const updateItem = (index, field, value) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        onChange(next);
    };
    const ingredientOptions = ingredients.map((i) => ({
        value: i.ing_id,
        label: i.ing_name,
    }));

    const emptyRow = () => ({
        ingredient_id: "",
        item_name: "",
        unit: "",
        quantity: 1,
        [priceField]: "",
    });

    const updateRow = (index, field, value) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        onChange(next);
    };

    const selectIngredient = (index, option) => {
        const next = [...items];
        next[index] = {
            ...next[index],
            ingredient_id: option.value,
            item_name: option.label,
        };
        onChange(next);
    };

    const typeCustomItemName = (index, text) => {
        // Free-text entry (non-stock item) — clear ingredient_id since it no longer matches an ingredient
        const next = [...items];
        next[index] = { ...next[index], item_name: text, ingredient_id: "" };
        onChange(next);
    };

    const selectUnit = (index, option) => {
        updateRow(index, "unit", option.value);
    };

    const unitLabel = (unitValue) => {
        for (const group of UNIT_OPTIONS) {
            const found = group.options.find((o) => o.value === unitValue);
            if (found) return found.label;
        }
        return unitValue;
    };

    const addRow = () => onChange([...items, emptyRow()]);

    const removeRow = (index) => {
        const next = items.filter((_, i) => i !== index);
        onChange(next.length ? next : [emptyRow()]);
    };

    return (
        <div>
            <table className="w-full text-sm border">
                <thead>
                    <tr className="bg-gray-50 text-left border-b">
                        <th className="p-2 w-1/3">Item</th>
                        <th className="p-2">Supplier</th>
                        <th className="p-2 w-40">Unit</th>
                        <th className="p-2">Quantity</th>
                        <th className="p-2">{priceLabel}</th>
                        <th className="p-2 w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b align-top">
                            <td className="p-2">
                                <SearchableSelect
                                    value={item.ingredient_id}
                                    displayValue={item.item_name}
                                    options={ingredientOptions}
                                    onSelect={(opt) =>
                                        selectIngredient(index, opt)
                                    }
                                    onCustomInput={(text) =>
                                        typeCustomItemName(index, text)
                                    }
                                    allowCustom
                                    placeholder="Search ingredient or type new item"
                                />
                            </td>
                            <td className="p-2">
                                <select
                                    value={item.supplier_id ?? ""}
                                    onChange={(e) =>
                                        updateItem(
                                            index,
                                            "supplier_id",
                                            e.target.value || null,
                                        )
                                    }
                                    className="w-full border rounded-md px-2 py-1.5"
                                >
                                    <option value="">— No supplier —</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.supplier_name}
                                        </option>
                                    ))}
                                </select>
                            </td>

                            <td className="p-2">
                                <SearchableSelect
                                    value={item.unit}
                                    displayValue={
                                        item.unit ? unitLabel(item.unit) : ""
                                    }
                                    options={UNIT_OPTIONS}
                                    onSelect={(opt) => selectUnit(index, opt)}
                                    onCustomInput={(text) =>
                                        updateRow(index, "unit", text)
                                    }
                                    allowCustom
                                    placeholder="Search unit..."
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        updateRow(
                                            index,
                                            "quantity",
                                            e.target.value,
                                        )
                                    }
                                    className="w-24 border rounded-md px-2 py-1.5 text-sm"
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item[priceField] ?? ""}
                                    onChange={(e) =>
                                        updateRow(
                                            index,
                                            priceField,
                                            e.target.value,
                                        )
                                    }
                                    className="w-28 border rounded-md px-2 py-1.5 text-sm"
                                />
                            </td>
                            <td className="p-2 text-right">
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-red-600 text-xs"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                type="button"
                onClick={addRow}
                className="mt-2 text-sm text-blue-600"
            >
                + Add item
            </button>
        </div>
    );
}
