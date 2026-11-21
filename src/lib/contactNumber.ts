export function localContactNumber(value: string) {
    const compact = value.trim().replace(/[\s()-]/g, "");
    return /^(?:\+?91)?\d{10}$/.test(compact) ? compact.slice(-10) : value.trim();
}
