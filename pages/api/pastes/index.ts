import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../lib/db";
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Invalid content" });
  }

  if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
    return res.status(400).json({ error: "Invalid ttl_seconds" });
  }

  if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
    return res.status(400).json({ error: "Invalid max_views" });
  }

  const id = nanoid(10);
  const now = Date.now();
  const expires_at = ttl_seconds ? now + ttl_seconds * 1000 : null;

  await pool.query(
    `INSERT INTO pastes (id, content, created_at, expires_at, max_views)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, content, now, expires_at, max_views ?? null]
  );

  return res.status(200).json({
    id,
    url: `${process.env.BASE_URL}/p/${id}`,
  });
}
