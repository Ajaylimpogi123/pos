// Place at: resources/js/Components/UnitSearchSelect.jsx
//
// Shared searchable unit dropdown, grouped by category, with keyboard
// navigation. Used by:
//   - Ingredient/Partials/AddModal.jsx & EditModal.jsx (picking a stock unit)
//   - Ingredient/Partials/IngredientConversionModal.jsx (picking a "from" unit)
//   - Product/Partials/IngredientQtyRow.jsx (picking a recipe-line unit)
//
// Pass `compact` for inline use inside a table cell (smaller trigger,
// shows the short unit code instead of the full label, fixed-width
// dropdown so it doesn't get squeezed by a narrow trigger).

import { useState, useRef, useEffect, useMemo } from "react";
import { canonicalUnit } from "./unitConversion";

export const UNIT_OPTIONS = [
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

export default function UnitSearchSelect({
    value,
    onChange,
    exclude = [],
    placeholder = "Select unit...",
    compact = false,
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const excludeSet = useMemo(
        () => new Set(exclude.map((u) => canonicalUnit(u))),
        [exclude],
    );

    // Always show the full catalog, minus anything explicitly excluded —
    // conversion validity is checked separately (convertQty), not by
    // pre-filtering the list down to only "known-convertible" units.
    const options = useMemo(
        () =>
            UNIT_OPTIONS.filter((o) => !excludeSet.has(canonicalUnit(o.value))),
        [excludeSet],
    );

    const selectedOption = useMemo(
        () => options.find((o) => o.value === value),
        [value, options],
    );

    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return options;
        return options.filter(
            (o) =>
                o.label.toLowerCase().includes(query) ||
                o.value.toLowerCase().includes(query) ||
                o.group.toLowerCase().includes(query),
        );
    }, [search, options]);

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

    const triggerHeight = compact ? "h-8" : "h-9";
    const triggerText = compact ? "text-xs" : "text-sm";
    const triggerPad = compact ? "px-2" : "px-3";
    const triggerDisplay = compact
        ? (selectedOption?.value ?? value ?? "")
        : (selectedOption?.label ?? value ?? "");

    return (
        <div
            ref={containerRef}
            className={`relative ${compact ? "w-24" : "w-full"}`}
        >
            {/* Trigger / Search Input */}
            <div
                className={`flex ${triggerHeight} w-full items-center rounded-md border border-input bg-background ${triggerPad} ${triggerText} shadow-sm cursor-pointer gap-1`}
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
                        placeholder="Search..."
                        className={`flex-1 w-0 bg-transparent outline-none placeholder:text-muted-foreground ${triggerText}`}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className={`flex-1 truncate ${!value ? "text-muted-foreground" : ""}`}
                    >
                        {value ? triggerDisplay : placeholder}
                    </span>
                )}
                <svg
                    className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
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

            {/* Dropdown List — fixed width so it stays readable even when
                the trigger itself is narrow (compact mode) */}
            {open && (
                <div
                    ref={listRef}
                    className={`absolute z-50 mt-1 ${compact ? "w-56" : "w-full"} rounded-md border border-input bg-popover shadow-md overflow-y-auto max-h-60`}
                >
                    {Object.keys(groupedOptions).length === 0 ? (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No units found.
                        </div>
                    ) : (
                        Object.entries(groupedOptions).map(
                            ([group, groupOptions]) => (
                                <div key={group}>
                                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                        {group}
                                    </div>
                                    {groupOptions.map((option) => {
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
