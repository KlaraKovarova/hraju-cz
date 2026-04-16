import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/unsubscribe?token=xxx&type=all|digest
// One-click unsubscribe via email link
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const type = searchParams.get("type") || "all";

  if (!token) {
    return new NextResponse(htmlPage("Chybějící token", "Neplatný odkaz pro odhlášení."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, email: true },
  });

  if (!user) {
    return new NextResponse(htmlPage("Neplatný token", "Odkaz pro odhlášení je neplatný nebo již byl použit."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const updateData: Record<string, boolean> = {};
  if (type === "digest") {
    updateData.weeklyDigest = false;
  } else if (type === "conditions") {
    updateData.conditionsDigest = false;
  } else {
    updateData.emailNotifications = false;
    updateData.weeklyDigest = false;
    updateData.conditionsDigest = false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  const message =
    type === "digest"
      ? "Byli jste odhlášeni z týdenního přehledu."
      : type === "conditions"
        ? "Byli jste odhlášeni z přehledu aktuálních podmínek."
        : "Byli jste odhlášeni ze všech e-mailových notifikací.";

  return new NextResponse(
    htmlPage("Odhlášení úspěšné", `${message} Nastavení můžete kdykoliv změnit ve svém profilu na hraju.cz.`),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – hraju.cz</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fafafa}
.card{background:#fff;border-radius:12px;padding:32px;max-width:480px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
h1{color:#18181b;font-size:1.5rem}p{color:#52525b}a{color:#059669}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="https://www.hraju.cz">Zpět na hraju.cz</a></p></div></body></html>`;
}
