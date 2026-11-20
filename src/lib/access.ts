export type StaffRole = "admin" | "registerer";
function includesEmail(raw: string | undefined, email: string) {
    if (!raw) return false;
    let list: unknown;
    try { list = JSON.parse(raw); } catch { list = raw.split(","); }
    return Array.isArray(list) && list.some(item => {
        const address = typeof item === "string" ? item : item?.email;
        return typeof address === "string" && address.trim().toLowerCase() === email.trim().toLowerCase();
    });
}
export function staffRole(email?: string | null): StaffRole | undefined {
    if (!email) return;
    if (includesEmail(process.env.ADMINS, email)) return "admin";
    if (includesEmail(process.env.REGISTERERS, email)) return "registerer";
}
