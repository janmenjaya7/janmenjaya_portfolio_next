import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "../lib/auth";
import { isStoreConfigured, readPortfolio } from "../lib/portfolio-store";
import AdminShell from "./_components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // proxy.ts already redirects, but never trust a single layer for auth
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");

  const { data, source } = await readPortfolio();
  return <AdminShell initialData={data} initialSource={source} storeConfigured={isStoreConfigured()} />;
}
