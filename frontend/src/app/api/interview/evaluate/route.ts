import { NextRequest } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authorization = req.headers.get("authorization") || "";

  const upstream = await fetch(`${BACKEND_BASE_URL}/api/interview/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body,
  });

  const contentType = upstream.headers.get("content-type") || "application/x-ndjson; charset=utf-8";

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
