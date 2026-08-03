import { useState, useRef, useEffect } from "react";

/**
 * Generic searchable dropdown ("combobox").
 *
 * options can be either:
 *   flat:    [{ value, label }]
 *   grouped: [{ group, icon, options: [{ value, label }] }]
 *
 * props:
 *  - value: currently selected value (used to highlight the active option)
 *  - displayValue: text shown in the input when it's not focused/being typed in
 *  - onSelect(option): called when the user clicks an option
 *  - onCustomInput(text): called on every keystroke — only needed if allowCustom is true
 *  - allowCustom: if true, typed text that matches nothing is still accepted (e.g. a
 *                 non-stock item name); if false, the field only accepts listed options
 */
export default function SearchableSelect({
    value,
    displayValue,
    options,
    onSelect,
    onCustomInput,
    placeholder = "Search...",
    allowCustom = false,
    className = "",
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isGrouped = options.length > 0 && options[0].options !== undefined;

    const matches = (opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase());

    const filteredGroups = isGrouped
        ? options
              .map((g) => ({ ...g, options: g.options.filter(matches) }))
              .filter((g) => g.options.length > 0)
        : null;

    const filteredFlat = !isGrouped ? options.filter(matches) : null;
    const hasResults = isGrouped
        ? filteredGroups.length > 0
        : filteredFlat.length > 0;

    const openDropdown = () => {
        setOpen(true);
        setSearch("");
    };

    const handleSelect = (opt) => {
        onSelect(opt);
        setOpen(false);
        setSearch("");
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setSearch(text);
        setOpen(true);
        if (allowCustom) {
            onCustomInput?.(text);
        }
    };

    const renderOption = (opt) => (
        <div
            key={opt.value}
            onClick={() => handleSelect(opt)}
            className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 ${
                value === opt.value
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
            }`}
        >
            {opt.label}
        </div>
    );

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={open ? search : (displayValue ?? "")}
                    onFocus={openDropdown}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full border rounded-md px-2 py-1.5 pr-6 text-sm"
                />
                <svg
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-auto">
                    {!hasResults && (
                        <div className="px-3 py-2 text-sm text-gray-400">
                            {allowCustom
                                ? `Using "${search}" as typed`
                                : "No matches"}
                        </div>
                    )}

                    {isGrouped
                        ? filteredGroups.map((g) => (
                              <div key={g.group}>
                                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                      {g.icon ? `${g.icon} ` : ""}
                                      {g.group}
                                  </div>
                                  {g.options.map(renderOption)}
                              </div>
                          ))
                        : filteredFlat.map(renderOption)}
                </div>
            )}
        </div>
    );
}
