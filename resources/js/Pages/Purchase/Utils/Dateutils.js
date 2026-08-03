/**
 * Laravel's `date` cast serializes to a full ISO timestamp
 * (e.g. "2026-07-17T00:00:00.000000Z") over Inertia, not a plain
 * "YYYY-MM-DD". These helpers convert that into what each context needs.
 */

// For display in tables/detail views: "Jul 17, 2026"
export function formatDisplayDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date)) return value; // fall back to raw value if unparseable
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC", // dates have no meaningful time component here
    });
}

// For <input type="date"> values, which require exactly "YYYY-MM-DD"
export function toInputDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date)) return "";
    return date.toISOString().slice(0, 10);
}
