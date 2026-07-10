import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import { Search, ChevronDown, X } from "lucide-react";
import useAddProduct from "../Hooks/useAddProduct";

export default function AddProductModal({
    children,
    categories,
    ingredients = [],
}) {
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
        handleFileChange,
        handleCategoryChange,
        addIngredient,
        removeIngredient,
        updateIngredientQty,
    } = useAddProduct();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredIngredients = ingredients.filter(
        (i) =>
            i.ing_name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
            !data.ingredients.find((s) => s.ing_id === i.ing_id), // hide already-selected
    );

    const handleSelect = (ing) => {
        addIngredient(ing);
        setIngredientSearch("");
        // keep dropdown open so user can keep adding
    };

    return (
        <>
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[560px] rounded-md max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="pb-4">
                            <DialogTitle>Add Product</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4">
                            {/* Category */}
                            <div className="grid gap-3">
                                <Label>Category</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={data.cat_id}
                                    onChange={(e) =>
                                        handleCategoryChange(e.target.value)
                                    }
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.cat_id}
                                            value={category.cat_id}
                                        >
                                            {category.cat_name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.cat_id} />
                            </div>

                            {/* Product Name */}
                            <div className="grid gap-3">
                                <Label>Product Name</Label>
                                <Input
                                    value={data.pd_name}
                                    onChange={(e) =>
                                        setData("pd_name", e.target.value)
                                    }
                                />
                                <InputError message={errors.pd_name} />
                            </div>

                            {/* Description */}
                            <div className="grid gap-3">
                                <Label>Product Description</Label>
                                <Input
                                    value={data.pd_description}
                                    onChange={(e) =>
                                        setData(
                                            "pd_description",
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.pd_description} />
                            </div>

                            {/* ── Ingredients Section ── */}
                            {ingredients.length > 0 && (
                                <div className="grid gap-3">
                                    <Label>Ingredients</Label>

                                    {/* Searchable dropdown trigger */}
                                    <div className="relative" ref={dropdownRef}>
                                        {/* Input + chevron */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                placeholder="Search and select ingredients..."
                                                value={ingredientSearch}
                                                onFocus={() =>
                                                    setDropdownOpen(true)
                                                }
                                                onChange={(e) => {
                                                    setIngredientSearch(
                                                        e.target.value,
                                                    );
                                                    setDropdownOpen(true);
                                                }}
                                                className="pl-9 pr-9"
                                            />
                                            <ChevronDown
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer transition-transform ${
                                                    dropdownOpen
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setDropdownOpen((v) => !v)
                                                }
                                            />
                                        </div>

                                        {/* Dropdown list */}
                                        {dropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto text-sm">
                                                {filteredIngredients.length ===
                                                0 ? (
                                                    <p className="px-3 py-2 text-muted-foreground">
                                                        {ingredientSearch
                                                            ? "No ingredients found."
                                                            : "All ingredients already added."}
                                                    </p>
                                                ) : (
                                                    filteredIngredients.map(
                                                        (ing) => (
                                                            <div
                                                                key={ing.ing_id}
                                                                onMouseDown={(
                                                                    e,
                                                                ) => {
                                                                    // onMouseDown fires before onBlur so selection registers
                                                                    e.preventDefault();
                                                                    handleSelect(
                                                                        ing,
                                                                    );
                                                                }}
                                                                className="flex justify-between items-center px-3 py-2 hover:bg-accent cursor-pointer"
                                                            >
                                                                <span>
                                                                    {
                                                                        ing.ing_name
                                                                    }{" "}
                                                                    <span className="text-muted-foreground text-xs">
                                                                        (
                                                                        {
                                                                            ing.unit
                                                                        }
                                                                        )
                                                                    </span>
                                                                </span>
                                                                <span className="text-xs text-primary font-medium">
                                                                    + Add
                                                                </span>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected ingredients table */}
                                    {data.ingredients.length > 0 && (
                                        <div className="border rounded-md overflow-hidden text-sm">
                                            <table className="w-full">
                                                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                                    <tr>
                                                        <th className="text-left px-3 py-2">
                                                            Ingredient
                                                        </th>
                                                        <th className="text-left px-3 py-2">
                                                            Unit
                                                        </th>
                                                        <th className="text-left px-3 py-2">
                                                            Qty / Product
                                                        </th>
                                                        <th className="px-3 py-2" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {data.ingredients.map(
                                                        (ing) => (
                                                            <tr
                                                                key={ing.ing_id}
                                                                className="hover:bg-muted/40"
                                                            >
                                                                <td className="px-3 py-2 font-medium">
                                                                    {
                                                                        ing.ing_name
                                                                    }
                                                                </td>
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    {ing.unit}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={
                                                                            ing.pd_ing_qty
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateIngredientQty(
                                                                                ing.ing_id,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-24 h-8"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeIngredient(
                                                                                ing.ing_id,
                                                                            )
                                                                        }
                                                                        className="text-destructive hover:text-destructive/80"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <InputError message={errors.ingredients} />
                                </div>
                            )}

                            {/* Price */}
                            <div className="grid gap-3">
                                <Label>Selling Price</Label>
                                <Input
                                    type="number"
                                    value={data.pd_price}
                                    onChange={(e) =>
                                        setData("pd_price", e.target.value)
                                    }
                                />
                                <InputError message={errors.pd_price} />
                            </div>

                            {/* Cost */}
                            <div className="grid gap-3">
                                <Label>Cost</Label>
                                <Input
                                    type="number"
                                    value={data.pd_cost}
                                    onChange={(e) =>
                                        setData("pd_cost", e.target.value)
                                    }
                                />
                                <InputError message={errors.pd_cost} />
                            </div>

                            {/* Qty */}
                            <div className="grid gap-3">
                                <Label>Qty</Label>
                                <Input
                                    type="number"
                                    value={data.pd_qty}
                                    onChange={(e) =>
                                        setData("pd_qty", e.target.value)
                                    }
                                />
                                <InputError message={errors.pd_qty} />
                            </div>

                            {/* Threshold */}
                            <div className="grid gap-3">
                                <Label>Threshold</Label>
                                <Input
                                    type="number"
                                    value={data.pd_mqty}
                                    onChange={(e) =>
                                        setData("pd_mqty", e.target.value)
                                    }
                                />
                                <InputError message={errors.pd_mqty} />
                            </div>

                            {/* Image */}
                            <div className="grid gap-2">
                                <Label>Product Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <InputError message={errors.pd_image} />
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                Submit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
