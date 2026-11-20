import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/* Home-screen icon: the "JB." logo on the site's dark background */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d2040, #050d1c)",
          color: "#f0f6ff",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        JB<span style={{ color: "#22d3ee" }}>.</span>
      </div>
    ),
    { ...size },
  );
}
