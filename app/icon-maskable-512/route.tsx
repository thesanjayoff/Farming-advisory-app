import { ImageResponse } from "next/og";

// Maskable icons need safe-area padding (~10%) so platform masks (circle,
// squircle, etc.) don't clip the glyph.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f5132",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80%",
            height: "80%",
            color: "white",
            fontSize: 230,
            fontWeight: 700,
          }}
        >
          வ
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
