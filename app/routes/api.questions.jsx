import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");
  if (!shop || !productId) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  const questions = await db.question.findMany({ where: { shop, productId, status: "answered" }, orderBy: { createdAt: "desc" } });
  return new Response(JSON.stringify({ questions }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: CORS_HEADERS });
  try {
    const body = await request.json();
    const { shop, productId, authorName, questionText } = body;
    if (!shop || !productId || !authorName || !questionText) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    const question = await db.question.create({ data: { shop, productId, authorName, questionText, status: "pending" } });
    return new Response(JSON.stringify({ question }), { status: 201, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
};