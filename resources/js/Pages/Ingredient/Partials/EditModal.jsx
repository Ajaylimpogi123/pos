import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import useEditProduct from "../Hooks/useEditProduct";
import { useState, useRef, useEffect, useMemo } from "react";

const UNIT_OPTIONS = [
    // Weight
    { value: "mg", label: "Milligram (mg)", group: "⚖️ Weight" },
    { value: "g", label: "Gram (g)", group: "⚖️ Weight" },
    { value: "kg", label: "Kilogram (kg)", group: "⚖️ Weight" },
    { value: "oz", label: "Ounce (oz)", group: "⚖️ Weight" },
    { value: "lb", label: "Pound (lb)", group: "⚖️ Weight" },

    // Volume
    { value: "mL", label: "Milliliter (mL)", group: "🧪 Volume" },
    { value: "L", label: "Liter (L)", group: "🧪 Volume" },
    { value: "tsp", label: "Teaspoon (tsp)", group: "🧪 Volume" },
    { value: "tbsp", label: "Tablespoon (tbsp)", group: "🧪 Volume" },
    { value: "fl oz", label: "Fluid Ounce (fl oz)", group: "🧪 Volume" },
    { value: "c", label: "Cup (c)", group: "🧪 Volume" },
    { value: "pt", label: "Pint (pt)", group: "🧪 Volume" },
    { value: "qt", label: "Quart (qt)", group: "🧪 Volume" },
    { value: "gal", label: "Gallon (gal)", group: "🧪 Volume" },

    // Cooking / Portion
    { value: "pinch", label: "Pinch", group: "🍳 Cooking / Portion" },
    { value: "dash", label: "Dash", group: "🍳 Cooking / Portion" },
    { value: "drop", label: "Drop", group: "🍳 Cooking / Portion" },
    { value: "scoop", label: "Scoop", group: "🍳 Cooking / Portion" },
    { value: "slice", label: "Slice", group: "🍳 Cooking / Portion" },
    { value: "pc", label: "Piece (pc)", group: "🍳 Cooking / Portion" },
    { value: "stick", label: "Stick", group: "🍳 Cooking / Portion" },
    { value: "clove", label: "Clove", group: "🍳 Cooking / Portion" },
    { value: "cube", label: "Cube", group: "🍳 Cooking / Portion" },
    { value: "can", label: "Can", group: "🍳 Cooking / Portion" },
    { value: "bottle", label: "Bottle", group: "🍳 Cooking / Portion" },
    { value: "pack", label: "Pack", group: "🍳 Cooking / Portion" },
    {
        value: "packet",
        label: "Packet / Sachet",
        group: "🍳 Cooking / Portion",
    },
    { value: "bag", label: "Bag", group: "🍳 Cooking / Portion" },
    { value: "box", label: "Box", group: "🍳 Cooking / Portion" },
    { value: "jar", label: "Jar", group: "🍳 Cooking / Portion" },
    { value: "tray", label: "Tray", group: "🍳 Cooking / Portion" },
    { value: "roll", label: "Roll", group: "🍳 Cooking / Portion" },
    { value: "bunch", label: "Bunch", group: "🍳 Cooking / Portion" },
    { value: "bundle", label: "Bundle", group: "🍳 Cooking / Portion" },
    { value: "head", label: "Head", group: "🍳 Cooking / Portion" },
    { value: "stalk", label: "Stalk", group: "🍳 Cooking / Portion" },
    { value: "sprig", label: "Sprig", group: "🍳 Cooking / Portion" },
    { value: "leaf", label: "Leaf / Leaves", group: "🍳 Cooking / Portion" },
    { value: "fillet", label: "Fillet", group: "🍳 Cooking / Portion" },
    { value: "chunk", label: "Chunk", group: "🍳 Cooking / Portion" },
    { value: "wedge", label: "Wedge", group: "🍳 Cooking / Portion" },
    { value: "serving", label: "Serving", group: "🍳 Cooking / Portion" },

    // Produce / Market
    { value: "dozen", label: "Dozen (12 pcs)", group: "🛒 Produce / Market" },
    { value: "half dozen", label: "Half Dozen", group: "🛒 Produce / Market" },
    { value: "sack", label: "Sack", group: "🛒 Produce / Market" },
    { value: "basket", label: "Basket", group: "🛒 Produce / Market" },
    { value: "crate", label: "Crate", group: "🛒 Produce / Market" },

    // Bakery
    { value: "loaf", label: "Loaf", group: "🍞 Bakery" },

    // Restaurant / Menu
    { value: "regular", label: "Regular", group: "🍽️ Restaurant / Menu" },
    { value: "large", label: "Large", group: "🍽️ Restaurant / Menu" },
    { value: "solo", label: "Solo", group: "🍽️ Restaurant / Menu" },
    {
        value: "family size",
        label: "Family Size",
        group: "🍽️ Restaurant / Menu",
    },
    { value: "order", label: "Order", group: "🍽️ Restaurant / Menu" },
];

function UnitSearchSelect({ value, onChange }) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const selectedLabel = useMemo(
        () => UNIT_OPTIONS.find((o) => o.value === value)?.label ?? "",
        [value],
    );

    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return UNIT_OPTIONS;
        return UNIT_OPTIONS.filter(
            (o) =>
                o.label.toLowerCase().includes(query) ||
                o.value.toLowerCase().includes(query) ||
                o.group.toLowerCase().includes(query),
        );
    }, [search]);

    const groupedOptions = useMemo(() => {
        return filteredOptions.reduce((acc, option) => {
            if (!acc[option.group]) acc[option.group] = [];
            acc[option.group].push(option);
            return acc;
        }, {});
    }, [filteredOptions]);

    useEffect(() => {
        setHighlighted(0);
    }, [search]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (listRef.current) {
            const el = listRef.current.querySelector(
                `[data-index="${highlighted}"]`,
            );
            if (el) el.scrollIntoView({ block: "nearest" });
        }
    }, [highlighted]);

    function handleSelect(option) {
        onChange(option.value);
        setSearch("");
        setOpen(false);
    }

    function handleKeyDown(e) {
        if (!open) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                setOpen(true);
                e.preventDefault();
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filteredOptions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredOptions[highlighted])
                handleSelect(filteredOptions[highlighted]);
        } else if (e.key === "Escape") {
            setOpen(false);
            setSearch("");
        }
    }

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger / Search Input */}
            <div
                className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm shadow-sm cursor-pointer gap-2"
                onClick={() => {
                    setOpen((o) => !o);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
            >
                {open ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search unit..."
                        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className={`flex-1 truncate ${!value ? "text-muted-foreground" : ""}`}
                    >
                        {value ? selectedLabel : "Select unit..."}
                    </span>
                )}
                <svg
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Dropdown List */}
            {open && (
                <div
                    ref={listRef}
                    className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md overflow-y-auto max-h-60"
                >
                    {Object.keys(groupedOptions).length === 0 ? (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No units found.
                        </div>
                    ) : (
                        Object.entries(groupedOptions).map(
                            ([group, options]) => (
                                <div key={group}>
                                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                        {group}
                                    </div>
                                    {options.map((option) => {
                                        const globalIndex =
                                            filteredOptions.indexOf(option);
                                        const isHighlighted =
                                            globalIndex === highlighted;
                                        const isSelected =
                                            option.value === value;
                                        return (
                                            <div
                                                key={option.value}
                                                data-index={globalIndex}
                                                onMouseEnter={() =>
                                                    setHighlighted(globalIndex)
                                                }
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSelect(option);
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer
                                                    ${isHighlighted ? "bg-accent text-accent-foreground" : ""}
                                                    ${isSelected ? "font-medium" : ""}
                                                `}
                                            >
                                                {option.label}
                                                {isSelected && (
                                                    <svg
                                                        className="h-4 w-4 text-primary shrink-0"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 20 4 15" />
                                                    </svg>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ),
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default function EditProductModal({ ingredient, children }) {
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
    } = useEditProduct(ingredient);

    return (
        <>
            {/* Trigger */}
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[425px] rounded-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="mb-2">
                                Edit Ingredient
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4">
                            {/* Ingredient Name */}
                            <div className="grid gap-2">
                                <Label>Ingredient Name</Label>
                                <Input
                                    value={data.ing_name}
                                    onChange={(e) =>
                                        setData("ing_name", e.target.value)
                                    }
                                />
                                <InputError message={errors.ing_name} />
                            </div>

                            {/* Cost */}
                            <div className="grid gap-2">
                                <Label>Cost</Label>
                                <Input
                                    type="number"
                                    value={data.ing_cost}
                                    onChange={(e) =>
                                        setData("ing_cost", e.target.value)
                                    }
                                />
                                <InputError message={errors.ing_cost} />
                            </div>

                            {/* Ingredient Unit — fixed: added value prop, fixed onChange */}
                            <div className="grid gap-3">
                                <Label>Ingredient Unit</Label>
                                <UnitSearchSelect
                                    value={data.unit}
                                    onChange={(val) => setData("unit", val)}
                                />
                                <InputError message={errors.unit} />
                            </div>

                            {/* Ingredient Qty */}
                            <div className="grid gap-2">
                                <Label>Ingredient Qty</Label>
                                <Input
                                    type="number"
                                    value={data.ing_qty}
                                    onChange={(e) =>
                                        setData("ing_qty", e.target.value)
                                    }
                                />
                                <InputError message={errors.ing_qty} />
                            </div>

                            {/* Threshold */}
                            <div className="grid gap-2">
                                <Label>Threshold</Label>
                                <Input
                                    type="number"
                                    value={data.ing_mqty}
                                    onChange={(e) =>
                                        setData("ing_mqty", e.target.value)
                                    }
                                />
                                <InputError message={errors.ing_mqty} />
                            </div>

                            {/* Image */}
                            <div className="grid gap-2">
                                <Label>Ingredient Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                {ingredient.ing_image && !data.ing_image && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500">
                                            Current image:
                                        </p>
                                        <img
                                            src={`/storage/${ingredient.ing_image}`}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    </div>
                                )}

                                {data.ing_image instanceof File && (
                                    <p className="text-xs text-green-500">
                                        New image selected:{" "}
                                        {data.ing_image.name}
                                    </p>
                                )}

                                <InputError message={errors.ing_image} />
                            </div>
                        </div>

                        <DialogFooter>
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
