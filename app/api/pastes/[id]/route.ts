// @ts-nocheck
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function now(req: Request) {
  if (process.env.TEST_MODE === "1") {
    const h = req.headers.get("x-test-now-ms");
    if (h) return Number(h);
  }
  return Date.now();
}

export async function GET(req: Request, context: any) {
  const id = context.params.id;

  const { rows } = await pool.query(
    "SELECT * FROM pastes WHERE id=$1",
    [id]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const p = rows[0];
  const current = now(req);

  if (p.expires_at && current >= p.expires_at) {
    return NextResponse.json({ error: "Expired" }, { status: 404 });
  }

  if (p.max_views !== null && p.views >= p.max_views) {
    return NextResponse.json({ error: "No views left" }, { status: 404 });
  }

  await pool.query(
    "UPDATE pastes SET views = views + 1 WHERE id=$1",
    [id]
  );

  return NextResponse.json({
    content: p.content,
    remaining_views: p.max_views
      ? Math.max(p.max_views - (p.views + 1), 0)
      : null,
    expires_at: p.expires_at
      ? new Date(p.expires_at).toISOString()
      : null,
  });
}
