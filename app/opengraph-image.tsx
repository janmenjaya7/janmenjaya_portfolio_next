import { ImageResponse } from "next/og";
import { DATA } from "./data";

export const alt = `${DATA.name} — ${DATA.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Link-preview card shown on WhatsApp, LinkedIn, X, Slack, etc. */
export default function OpengraphImage() {
  const host = DATA.siteUrl.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(circle at 85% 15%, rgba(59,130,246,0.35), transparent 45%), linear-gradient(135deg, #0a1a30, #050d1c)",
          color: "#f0f6ff",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          JB<span style={{ color: "#22d3ee" }}>.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
            {DATA.name}
          </div>
          <div style={{ marginTop: 24, fontSize: 40, color: "#93c5fd" }}>
            {`${DATA.role} · React.js · Next.js · TypeScript`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#94a3b8",
          }}
        >
          <span>{DATA.location}</span>
          <span style={{ color: "#22d3ee" }}>{host}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
