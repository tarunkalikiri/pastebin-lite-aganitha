import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../lib/db";

function now(req: NextApiRequest) {
  if (process.env.TEST_MODE === "1") {
    const h = req.headers["x-test-now-ms"];
    if (typeof h === "string") return Number(h);
  }
  return Date.now();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  const { rows } = await pool.query(
    "SELECT * FROM pastes WHERE id=$1",
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  const p = rows[0];
  const current = now(req);

  if (p.expires_at && current >= p.expires_at) {
    return res.status(404).json({ error: "Expired" });
  }

  if (p.max_views !== null && p.views >= p.max_views) {
    return res.status(404).json({ error: "No views left" });
  }

  await pool.query("UPDATE pastes SET views = views + 1 WHERE id=$1", [id]);

  return res.status(200).json({
    content: p.content,
    remaining_views: p.max_views
      ? Math.max(p.max_views - (p.views + 1), 0)
      : null,
    expires_at: p.expires_at
      ? new Date(p.expires_at).toISOString()
      : null,
  });
}
