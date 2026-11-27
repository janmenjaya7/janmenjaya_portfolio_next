/* Contact form rules — pure, so both the browser form and the API use the same checks */

export type ContactInput = { name: string; email: string; subject: string; message: string };
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export const CONTACT_LIMITS = { name: 100, email: 200, subject: 150, message: 5000 } as const;

/** Spam usually stuffs links; a real enquiry rarely needs more than a few. */
export const MAX_LINKS = 3;

/** Number of web links in a text (http(s)://…, www.…). */
export function countLinks(text: string): number {
  return (text.match(/\b(?:https?:\/\/|www\.)\S+/gi) ?? []).length;
}

/** Fastest a person can plausibly fill in the form; quicker submissions are treated as bots. */
export const MIN_FILL_MS = 3000;

/**
 * True when the form was submitted faster than a person could type it. Unknown timing (older cached page,
 * non-browser client) is not treated as a bot — the rate limits still apply to those.
 */
export function submittedTooFast(elapsedMs: unknown): boolean {
  return typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < MIN_FILL_MS;
}

export function validateContact(raw: unknown): { data: ContactInput } | { errors: FieldErrors } {
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const data: ContactInput = { name: str("name"), email: str("email"), subject: str("subject"), message: str("message") };
  const errors: FieldErrors = {};

  if (!data.name) errors.name = "Please enter your name.";
  if (!data.email) errors.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!data.subject) errors.subject = "Please add a subject.";
  if (!data.message) errors.message = "Please write a message.";
  else if (data.message.length < 10) errors.message = "Message should be at least 10 characters.";

  if (!errors.message && countLinks(data.message) > MAX_LINKS) errors.message = `Please include no more than ${MAX_LINKS} links.`;

  (Object.keys(CONTACT_LIMITS) as (keyof ContactInput)[]).forEach((k) => {
    if (!errors[k] && data[k].length > CONTACT_LIMITS[k]) errors[k] = `Keep it under ${CONTACT_LIMITS[k]} characters.`;
  });

  return Object.keys(errors).length ? { errors } : { data };
}
