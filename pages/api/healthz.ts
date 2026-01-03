import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../lib/db";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
}
