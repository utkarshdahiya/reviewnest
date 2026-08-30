import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
};

export const loader = async ({ request }) => {
  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return new Response(
      JSON.stringify({ error: "Missing Shop or Product ID" }),
      {
        status: 400,
        headers: CORS_HEADERS
      }
    );
  }

  const questions = await db.question.findMany({
  where: { shop, productId, status: "APPROVED" },
  select: { questionText: true },   // ✅ correct
});

  return new Response(JSON.stringify({ questions }), {
    headers: CORS_HEADERS
  });
};

// Minimal action – you can expand later
export const action = async ({ request }) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: CORS_HEADERS
  });
};