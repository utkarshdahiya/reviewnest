import { data } from "react-router";
import { getApprovedReviewsForProduct, getAverageRating, createReview, getShopSettings } from "../models/reviews.server";

// This is the most permissive CORS config possible to find the problem
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function loader({ request }) {
  // 1. HANDLE PREFLIGHT IMMEDIATELY
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return new Response(JSON.stringify({ error: "Missing shop or productId" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const reviews = await getApprovedReviewsForProduct(shop, productId);
    const summary = await getAverageRating(shop, productId);
    const settings = await getShopSettings(shop);
    return new Response(JSON.stringify({ reviews, summary, settings }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

export async function action({ request }) {
  // 2. HANDLE PREFLIGHT IMMEDIATELY
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const formData = await request.json();
    const { shop, productId, authorName, rating, title, body, imageUrl } = formData;

    if (!productId || !authorName || !rating || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const review = await createReview({ shop, productId, authorName, rating, title, body, imageUrl });
    return new Response(JSON.stringify({ ok: true, review }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON or Server Error" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}