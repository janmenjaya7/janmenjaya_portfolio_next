/* Field-level checks shown inline in the editor; saving is blocked while any fail */

const URL_KEYS = new Set(["url", "linkedin", "github"]);

export function validateField(key: string, value: unknown): string | null {
  if (typeof value === "string") {
    const v = value.trim();
    if (key === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return "Enter a valid email address.";
    }
    if (URL_KEYS.has(key) && v && !/^https?:\/\/\S+$/i.test(v)) {
      return "URL must start with http:// or https://";
    }
    if (key === "name" && !v) return "Name is required.";
  }
  if (typeof value === "number" && key === "level" && (value < 0 || value > 100)) {
    return "Level must be between 0 and 100.";
  }
  return null;
}

/* Walks a value and returns every validation message inside it */
export function collectErrors(key: string, value: unknown): string[] {
  const own = validateField(key, value);
  const errors = own ? [own] : [];
  if (Array.isArray(value)) {
    value.forEach((v) => errors.push(...collectErrors(key, v)));
  } else if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([k, v]) => errors.push(...collectErrors(k, v)));
  }
  return errors;
}
