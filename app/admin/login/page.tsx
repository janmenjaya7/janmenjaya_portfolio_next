import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthConfigured, SESSION_COOKIE, verifySessionToken } from "../../lib/auth";
import { isStoreConfigured } from "../../lib/portfolio-store";
import LoginForm from "../_components/LoginForm";

export const metadata: Metadata = { title: "Admin login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) redirect("/admin");

  // Login codes live in Redis, so both email and storage must be configured
  return <LoginForm configured={isAuthConfigured() && isStoreConfigured()} />;
}
