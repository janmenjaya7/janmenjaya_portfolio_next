import { NextResponse, type NextRequest } from "next/server";
import { jsonError, readJson } from "../../lib/api-guard";
import { addMessage, InboxFullError, validateContact } from "../../lib/messages";
import { StoreNotConfiguredError } from "../../lib/portfolio-store";
import { submittedTooFast } from "../../lib/contact-validation";
import { isOverGlobalLimit, isRateLimited } from "../../lib/rate-limit";

const PER_VISITOR_PER_HOUR = 5;
const SITE_WIDE_PER_DAY = 50; // a ceiling for floods spread over many IPs

/* POST /api/contact — public: { name, email, subject, message } → stored for the admin */
export async function POST(request: NextRequest) {
  const body = await readJson(request);

  const raw = (typeof body === "object" && body !== null ? body : {}) as { website?: unknown; elapsed?: unknown };
  // Bots: the hidden "website" field filled in, or the form sent faster than anyone could type it.
  // Reply "ok" so they don't learn to adapt; nothing is stored.
  if (raw.website || submittedTooFast(raw.elapsed)) {
    return NextResponse.json({ ok: true });
  }

  const result = validateContact(body);
  if ("errors" in result) {
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fields: result.errors },
      { status: 400 },
    );
  }

  if (await isRateLimited("contact", request, PER_VISITOR_PER_HOUR, 60 * 60)) {
    return jsonError("You've sent several messages already. Please try again in an hour.", 429);
  }
  if (await isOverGlobalLimit("contact", SITE_WIDE_PER_DAY, 24 * 60 * 60)) {
    return jsonError("The inbox is busy right now. Please email me directly instead.", 429);
  }

  try {
    await addMessage(result.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StoreNotConfiguredError) {
      return jsonError("Messages can't be received right now. Please email me directly.", 503);
    }
    if (err instanceof InboxFullError) {
      return jsonError("The inbox is full right now. Please email me directly.", 503);
    }
    console.error("[contact]", err);
    return jsonError("Something went wrong while sending. Please try again.", 500);
  }
}
