import { connection } from "next/server";
import { getHealth } from "@/lib/ai/limits";
import { json } from "@/lib/ai/request";

/** AI budget state, used by the chat panel to switch into class mode (cached answers only). */
export async function GET() {
  await connection();
  const { classMode, reason } = await getHealth();
  return json({ classMode, reason });
}
