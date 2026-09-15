// Place at: resources/js/Utils/unitConversion.js
// (adjust the import path in IngredientQtyRow.jsx if your alias differs)
//
// Converts a recipe quantity entered in one unit into the ingredient's
// native stock unit, so the recipe builder can accept "100 mL" against
// an ingredient stocked in Liters and still deduct correctly.

const ALIASES = {
    // mass
    mg: "mg",
    milligram: "mg",
    milligrams: "mg",
    g: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",

    // volume
    ml: "mL",
    milliliter: "mL",
    milliliters: "mL",
    l: "L",
    liter: "L",
    liters: "L",
    litre: "L",
    litres: "L",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    "fl oz": "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    c: "c",
    cup: "c",
    cups: "c",
    pt: "pt",
    pint: "pt",
    pints: "pt",
    qt: "qt",
    quart: "qt",
    quarts: "qt",
    gal: "gal",
    gallon: "gal",
    gallons: "gal",

    // count
    pc: "pc",
    piece: "pc",
    pieces: "pc",
    dozen: "dozen",
    "half dozen": "half dozen",
};

// Conversion factors into each group's base unit (g for mass, mL for volume).
const GROUPS = {
    mass: { mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
    volume: {
        mL: 1,
        L: 1000,
        tsp: 4.92892,
        tbsp: 14.7868,
        "fl oz": 29.5735,
        c: 236.588,
        pt: 473.176,
        qt: 946.353,
        gal: 3785.41,
    },
    count: { pc: 1, dozen: 12, "half dozen": 6 },
};

function canonicalUnit(unit) {
    if (!unit) return null;
    const key = String(unit).trim().toLowerCase();
    return ALIASES[key] ?? String(unit).trim();
}

function findGroup(canonical) {
    for (const [group, factors] of Object.entries(GROUPS)) {
        if (canonical in factors) return group;
    }
    return null;
}

/**
 * Convert `value` from `fromUnit` to `toUnit`.
 * Returns null when the two units aren't in the same convertible family
 * (e.g. converting "L" to "clove" isn't meaningful).
 */
export function convertQty(value, fromUnit, toUnit) {
    const from = canonicalUnit(fromUnit);
    const to = canonicalUnit(toUnit);
    if (from === to) return value;

    const fromGroup = findGroup(from);
    const toGroup = findGroup(to);
    if (!fromGroup || fromGroup !== toGroup) return null;

    const factors = GROUPS[fromGroup];
    const inBaseUnit = value * factors[from];
    return inBaseUnit / factors[to];
}

/**
 * All units that can be converted with `unit`, including itself.
 * Falls back to just `[unit]` if it isn't part of a known family
 * (e.g. "clove", "slice" stay fixed — no conversion offered).
 */
export function getCompatibleUnits(unit) {
    const canonical = canonicalUnit(unit);
    const group = findGroup(canonical);
    if (!group) return [unit];
    return Object.keys(GROUPS[group]);
}

export function isConvertible(unitA, unitB) {
    return convertQty(1, unitA, unitB) !== null;
}
