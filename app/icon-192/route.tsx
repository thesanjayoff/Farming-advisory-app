import { ImageResponse } from "next/og";

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
          color: "white",
          fontSize: 110,
          fontWeight: 700,
        }}
      >
        வ
      </div>
    ),
    { width: 192, height: 192 }
  );
}
