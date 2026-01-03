import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const { ttl_seconds, max_views } = body;

  if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
    return NextResponse.json({ error: "Invalid ttl_seconds" }, { status: 400 });
  }
  if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
    return NextResponse.json({ error: "Invalid max_views" }, { status: 400 });
  }

  const id = nanoid(10);
  const now = Date.now();
  const expiresAt = ttl_seconds ? now + ttl_seconds * 1000 : null;

  await pool.query(
    `INSERT INTO pastes (id, content, created_at, expires_at, max_views)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, body.content, now, expiresAt, max_views ?? null]
  );

  return NextResponse.json({
    id,
    url: `${process.env.BASE_URL}/p/${id}`,
  });
}
