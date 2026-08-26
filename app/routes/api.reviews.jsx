import { data } from "react-router";
import { getApprovedReviewsForProduct, getAverageRating, createReview, getShopSettings } from "../models/reviews.server";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return new Response(JSON.stringify({ error: "Missing shop or productId" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
    });
  }

  const reviews = await getApprovedReviewsForProduct(shop, productId);
  const summary = await getAverageRating(shop, productId);
  const settings = await getShopSettings(shop);

  return new Response(JSON.stringify({ reviews, summary, settings }), {
    headers: { "Content-Type": "application/json", ...getCorsHeaders() },
  });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
    });
  }

  try {
    const formData = await request.json();
    const { shop, productId, authorName, rating, title, body, imageUrl } = formData;

    if (!productId || !authorName || !rating || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
      });
    }

    const review = await createReview({ shop, productId, authorName, rating, title, body, imageUrl });
    return new Response(JSON.stringify({ ok: true, review }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
    });
  }
}