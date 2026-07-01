import { getUsage } from "@/lib/server/usage-tracker";

export const runtime = "nodejs";

export async function GET() {
  const usage = getUsage();
  return Response.json(usage);
}
