import { data } from "react-router";
import { getApprovedReviewsForProduct, getAverageRating, createReview, getShopSettings } from "../models/reviews.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return data({ error: "Missing shop or productId" }, { status: 400, headers: corsHeaders });
  }

  const reviews = await getApprovedReviewsForProduct(shop, productId);
  const summary = await getAverageRating(shop, productId);
  const settings = await getShopSettings(shop);
  return data({ reviews, summary, settings }, { headers: corsHeaders });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const formData = await request.json();
  const { shop, productId, authorName, rating, title, body, imageUrl } = formData;

  if (!productId || !authorName || !rating || !body) {
    return data({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
  }

  const review = await createReview({ shop, productId, authorName, rating, title, body, imageUrl });
  return data({ ok: true, review }, { headers: corsHeaders });
}