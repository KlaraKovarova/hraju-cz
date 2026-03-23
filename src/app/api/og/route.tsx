import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "hraju.cz";
  const subtitle = searchParams.get("subtitle") ?? "";
  const icon = searchParams.get("icon") ?? "🏟️";
  const rating = searchParams.get("rating");
  const type = searchParams.get("type") ?? "facility"; // facility | blog | review

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdf4 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#059669",
              letterSpacing: "-0.5px",
            }}
          >
            hraju.cz
          </div>
          <div
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#a1a1aa",
            }}
          />
          <div style={{ fontSize: "18px", color: "#71717a" }}>
            {type === "blog" ? "Blog" : type === "review" ? "Recenze" : "Sportoviště"}
          </div>
        </div>

        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}>
          <div
            style={{
              fontSize: "72px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                fontSize: title.length > 40 ? "36px" : "48px",
                fontWeight: 800,
                color: "#18181b",
                lineHeight: 1.15,
                letterSpacing: "-1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#52525b",
                  marginTop: "12px",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        {rating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#fef3c7",
                padding: "8px 16px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "24px" }}>⭐</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#92400e",
                }}
              >
                {rating}
              </div>
            </div>
          </div>
        )}

        {/* Bottom green bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #059669, #34d399)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
