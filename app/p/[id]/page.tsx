import { notFound } from "next/navigation";
import { pool } from "@/lib/db";

export default async function Paste({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const now = Date.now();

  const { rows } = await pool.query(
    `
    UPDATE pastes
    SET views = views + 1
    WHERE id = $1
      AND (expires_at IS NULL OR expires_at > $2)
      AND (max_views IS NULL OR views < max_views)
    RETURNING content
    `,
    [id, now]
  );

  if (rows.length === 0) return notFound();

  return (
    <pre style={{ whiteSpace: "pre-wrap", padding: 20 }}>
      {rows[0].content}
    </pre>
  );
}
