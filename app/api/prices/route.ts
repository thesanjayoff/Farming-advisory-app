import { NextRequest, NextResponse } from "next/server";
import { getMandiPrices } from "@/lib/prices/service";

export async function GET(req: NextRequest) {
  const commodity = req.nextUrl.searchParams.get("commodity");
  if (!commodity) {
    return NextResponse.json({ error: "commodity query param is required" }, { status: 400 });
  }
  const state = req.nextUrl.searchParams.get("state") ?? "Tamil Nadu";
  const district = req.nextUrl.searchParams.get("district") ?? undefined;
  const market = req.nextUrl.searchParams.get("market") ?? undefined;

  const result = await getMandiPrices({ commodity, state, district, market });
  return NextResponse.json(result);
}
