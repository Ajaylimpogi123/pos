// Place at: resources/js/Pages/Product/Partials/unitConversion.js
//
// Converts a recipe quantity entered in one unit into the ingredient's
// native stock unit.
//
// Two conversion paths:
//  1. Automatic — units in the same physical family (mass, volume, count)
//     convert via fixed, universal factors. Always safe, no guessing.
//  2. Custom — cross-family conversions (e.g. cups -> grams) depend on the
//     specific ingredient's density and can't be guessed. These come from
//     `tbl_ingredient_conversion`, defined per-ingredient by staff via
//     IngredientConversionModal, and are passed in as `customConversions`
//     (the `conversions` relation on each ingredient object from the
//     backend).

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

export function canonicalUnit(unit) {
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

function findCustomFactor(fromUnit, toUnit, customConversions) {
    if (!customConversions?.length) return null;

    const from = String(fromUnit).trim().toLowerCase();
    const to = String(toUnit).trim().toLowerCase();

    const direct = customConversions.find(
        (c) =>
            String(c.from_unit).trim().toLowerCase() === from &&
            String(c.to_unit).trim().toLowerCase() === to,
    );
    if (direct) return Number(direct.factor);

    // Same pair stored the other way round — invert the factor.
    const inverse = customConversions.find(
        (c) =>
            String(c.from_unit).trim().toLowerCase() === to &&
            String(c.to_unit).trim().toLowerCase() === from,
    );
    if (inverse && Number(inverse.factor) !== 0) {
        return 1 / Number(inverse.factor);
    }

    return null;
}

/**
 * Convert `value` from `fromUnit` to `toUnit`.
 * Checks ingredient-specific custom conversions first, then falls back to
 * automatic same-family conversion. Returns null if neither applies.
 */
export function convertQty(value, fromUnit, toUnit, customConversions = []) {
    const from = canonicalUnit(fromUnit);
    const to = canonicalUnit(toUnit);
    if (from === to) return value;

    const customFactor = findCustomFactor(fromUnit, toUnit, customConversions);
    if (customFactor !== null) return value * customFactor;

    const fromGroup = findGroup(from);
    const toGroup = findGroup(to);
    if (!fromGroup || fromGroup !== toGroup) return null;

    const factors = GROUPS[fromGroup];
    const inBaseUnit = value * factors[from];
    return inBaseUnit / factors[to];
}

/**
 * All units usable for this ingredient: same-family automatic units, plus
 * any ingredient-specific custom units. Falls back to just the
 * ingredient's own unit if neither applies.
 */
export function getCompatibleUnits(unit, customConversions = []) {
    const canonical = canonicalUnit(unit);
    const group = findGroup(canonical);

    const automatic = group ? Object.keys(GROUPS[group]) : [unit];

    const custom = (customConversions ?? [])
        .filter(
            (c) =>
                String(c.to_unit).trim().toLowerCase() ===
                String(unit).trim().toLowerCase(),
        )
        .map((c) => c.from_unit);

    return Array.from(new Set([...automatic, ...custom]));
}

export function isConvertible(unitA, unitB, customConversions = []) {
    return convertQty(1, unitA, unitB, customConversions) !== null;
}
