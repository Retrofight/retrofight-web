// Turns a title into a URL-safe slug: lowercased, accents stripped, non-alphanumerics
// collapsed to single hyphens. Returns "" for empty/symbol-only input.
export function slugify(input: string): string {
    return input
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "") // strip combining diacritics
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
