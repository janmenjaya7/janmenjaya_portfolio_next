/* Contact form rules — pure, so both the browser form and the API use the same checks */

export type ContactInput = { name: string; email: string; subject: string; message: string };
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export const CONTACT_LIMITS = { name: 100, email: 200, subject: 150, message: 5000 } as const;

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

  (Object.keys(CONTACT_LIMITS) as (keyof ContactInput)[]).forEach((k) => {
    if (!errors[k] && data[k].length > CONTACT_LIMITS[k]) errors[k] = `Keep it under ${CONTACT_LIMITS[k]} characters.`;
  });

  return Object.keys(errors).length ? { errors } : { data };
}
