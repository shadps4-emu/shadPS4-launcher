export function capitalize(v: string): string {
    if (!v) {
        return v;
    }
    return v.charAt(0).toUpperCase() + v.slice(1);
}
