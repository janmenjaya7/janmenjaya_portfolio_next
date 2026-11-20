import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "../lib/auth";
import { listMessages, type ContactMessage } from "../lib/messages";
import { isStoreConfigured, readPortfolio } from "../lib/portfolio-store";
import AdminShell from "./_components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // proxy.ts already redirects, but never trust a single layer for auth
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");

  const [{ data, source }, inbox] = await Promise.all([readPortfolio(), loadInbox()]);
  return (
    <AdminShell
      initialData={data}
      initialSource={source}
      storeConfigured={isStoreConfigured()}
      initialMessages={inbox.messages}
      initialMessagesError={inbox.error}
    />
  );
}

async function loadInbox(): Promise<{ messages: ContactMessage[]; error: string }> {
  if (!isStoreConfigured()) return { messages: [], error: "Messages need Redis — configure Upstash to receive them." };
  try {
    return { messages: await listMessages(), error: "" };
  } catch (err) {
    console.error("[admin] loading messages failed:", err);
    return { messages: [], error: "Couldn't load messages right now. Try Refresh." };
  }
}
