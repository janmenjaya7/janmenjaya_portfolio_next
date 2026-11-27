import type { PortfolioData } from "../../data";
import type { ContactMessage } from "../../lib/messages";
import type { StoreSource } from "../../lib/portfolio-store";
import type { ResumeInfo } from "../../lib/resume-store";
import type { ShotIndex } from "../../lib/shot-validation";
import type { VisitorSummary } from "../../lib/analytics";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/* JSON fetch for admin calls; turns every failure into a readable ApiError */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Network error — check your connection and try again.", 0);
  }
  const body = (await res.json().catch(() => null)) as
    | { ok?: boolean; data?: T; error?: string }
    | null;
  if (!res.ok || !body?.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status}).`, res.status);
  }
  return body.data as T;
}

export const adminApi = {
  fetchLatest: () => request<{ data: PortfolioData; source: StoreSource }>("/api/admin/portfolio"),
  listMessages: () => request<ContactMessage[]>("/api/admin/messages"),
  setMessageRead: (id: string, read: boolean) =>
    request<ContactMessage>(`/api/admin/messages/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ read }),
    }),
  deleteMessage: (id: string) =>
    request<undefined>(`/api/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" }),
  saveSection: (key: string, value: unknown) =>
    request<PortfolioData>(`/api/portfolio/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify(value),
    }),
  resetAll: () => request<PortfolioData>("/api/portfolio", { method: "DELETE" }),
  requestCode: (email: string) =>
    request<undefined>("/api/admin/otp/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyCode: (code: string) =>
    request<undefined>("/api/admin/otp/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  logout: () => request<undefined>("/api/admin/logout", { method: "POST" }),
  getResume: () => request<ResumeInfo>("/api/admin/resume"),
  deleteResume: () => request<ResumeInfo>("/api/admin/resume", { method: "DELETE" }),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return upload<ResumeInfo>("/api/admin/resume", form);
  },
  getVisitors: (days: number) => request<VisitorSummary>(`/api/admin/visitors?days=${days}`),
  clearVisitors: () => request<{ removed: number }>("/api/admin/visitors", { method: "DELETE" }),
  getShots: () => request<ShotIndex>("/api/admin/project-shots"),
  deleteShot: (slug: string) => request<ShotIndex>(`/api/admin/project-shots?slug=${encodeURIComponent(slug)}`, { method: "DELETE" }),
  uploadShot: (slug: string, file: File) => {
    const form = new FormData();
    form.append("slug", slug);
    form.append("file", file);
    return upload<ShotIndex>("/api/admin/project-shots", form);
  },
};

/* multipart upload: no JSON content-type, the browser sets the boundary */
async function upload<T>(url: string, form: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "PUT", body: form, cache: "no-store" });
  } catch {
    throw new ApiError("Network error — check your connection and try again.", 0);
  }
  const body = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string } | null;
  if (!res.ok || !body?.ok || !body.data) throw new ApiError(body?.error || `Upload failed (${res.status}).`, res.status);
  return body.data;
}
