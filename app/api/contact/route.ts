import { NextResponse, type NextRequest } from "next/server";
import { jsonError, readJson } from "../../lib/api-guard";
import { addMessage, InboxFullError, validateContact } from "../../lib/messages";
import { StoreNotConfiguredError } from "../../lib/portfolio-store";
import { isRateLimited } from "../../lib/rate-limit";

/* POST /api/contact — public: { name, email, subject, message } → stored for the admin */
export async function POST(request: NextRequest) {
  const body = await readJson(request);

  // Honeypot: real visitors never see or fill the "website" field
  if (typeof body === "object" && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  const result = validateContact(body);
  if ("errors" in result) {
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fields: result.errors },
      { status: 400 },
    );
  }

  if (await isRateLimited("contact", request, 5, 60 * 60)) {
    return jsonError("You've sent several messages already. Please try again in an hour.", 429);
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
