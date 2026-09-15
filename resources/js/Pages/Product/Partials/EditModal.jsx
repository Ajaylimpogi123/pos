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
import { Search, ChevronDown } from "lucide-react";
import useEditProduct from "../Hooks/useEditProduct";
import IngredientQtyRow from "./IngredientQtyRow";

export default function EditProductModal({
    product,
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
        addIngredient,
        removeIngredient,
        updateIngredientQty,
    } = useEditProduct(product);

    // Close dropdown on outside click
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

    // Reset dropdown state when modal closes
    useEffect(() => {
        if (!open) {
            setIngredientSearch("");
            setDropdownOpen(false);
        }
    }, [open]);

    const filteredIngredients = ingredients.filter(
        (i) =>
            i.ing_name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
            !data.ingredients.find((s) => s.ing_id === i.ing_id),
    );

    const handleSelect = (ing) => {
        addIngredient(ing);
        setIngredientSearch("");
    };

    return (
        <>
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[580px] rounded-md max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="mb-2">
                                Edit Product
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4">
                            {/* Category */}
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <select
                                    value={data.cat_id}
                                    onChange={(e) =>
                                        setData("cat_id", e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select a category</option>
                                    {categories?.map((cat) => (
                                        <option
                                            key={cat.cat_id}
                                            value={cat.cat_id}
                                        >
                                            {cat.cat_name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.cat_id} />
                            </div>

                            {/* Product Name */}
                            <div className="grid gap-2">
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
                            <div className="grid gap-2">
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

                                    {/* Searchable dropdown */}
                                    <div className="relative" ref={dropdownRef}>
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
                                        <div className="border rounded-md text-sm">
                                            <table className="w-full">
                                                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                                    <tr>
                                                        <th className="text-left px-3 py-2">
                                                            Ingredient
                                                        </th>
                                                        <th className="text-left px-3 py-2">
                                                            Stock Unit
                                                        </th>
                                                        <th className="text-left px-3 py-2">
                                                            Recipe Qty
                                                        </th>
                                                        <th className="px-2 py-2" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {data.ingredients.map(
                                                        (ing) => (
                                                            <IngredientQtyRow
                                                                key={ing.ing_id}
                                                                ing={ing}
                                                                onQtyChange={
                                                                    updateIngredientQty
                                                                }
                                                                onRemove={
                                                                    removeIngredient
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <InputError message={errors.ingredients} />
                                </div>
                            )}

                            {/* Selling Price */}
                            <div className="grid gap-2">
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
                            <div className="grid gap-2">
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
                            <div className="grid gap-2">
                                <Label>Product Qty</Label>
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
                            <div className="grid gap-2">
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
                                {product.pd_image && !data.pd_image && (
                                    <div className="mt-2">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Current image:
                                        </p>
                                        <img
                                            src={`/storage/${product.pd_image}`}
                                            className="w-20 h-20 object-cover rounded border"
                                        />
                                    </div>
                                )}
                                {data.pd_image instanceof File && (
                                    <p className="text-xs text-green-500">
                                        New image selected: {data.pd_image.name}
                                    </p>
                                )}
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
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
