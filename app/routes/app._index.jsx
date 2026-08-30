import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page,
  Card,
  Badge,
  Button,
  BlockStack,
  InlineStack,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// Loader: fetch all reviews for the shop
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const reviews = await db.review.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return { reviews };
};

// Action: handle approve/reject with debug logs
export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    console.log("📦 Form data received:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const { session } = await authenticate.admin(request);
    console.log("✅ Authenticated shop:", session.shop);

    const id = formData.get("id");
    const actionType = formData.get("actionType");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!actionType) {
      return new Response(
        JSON.stringify({ error: "Missing actionType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Approve or reject the review
    if (actionType === "approve") {
      await db.review.update({
        where: { id: id }, // id is a cuid (string)
        data: { status: "approved" },
      });
    } else if (actionType === "reject") {
      await db.review.update({
        where: { id: id },
        data: { status: "rejected" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid actionType: ${actionType}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 Action error:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Single review row component
function ReviewRow({ review }) {
  const fetcher = useFetcher();

  const approve = () => {
    fetcher.submit(
      { id: review.id, actionType: "approve" },
      { method: "post" }
    );
  };

  const reject = () => {
    fetcher.submit(
      { id: review.id, actionType: "reject" },
      { method: "post" }
    );
  };

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <BlockStack gap="050">
            <p>
              <strong>{review.authorName}</strong> rated {review.rating}★ for product {review.productId}
            </p>
            <p>{review.body}</p>
            {review.imageUrl && <img src={review.imageUrl} alt="Review photo" width="100" />}
          </BlockStack>
          <Badge tone={
            review.status === "approved" ? "success" :
            review.status === "rejected" ? "critical" : "attention"
          }>
            {review.status}
          </Badge>
        </InlineStack>
        <InlineStack gap="200">
          <Button onClick={approve} variant="primary">Approve</Button>
          <Button onClick={reject} tone="critical">Reject</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

// Main page
export default function ReviewsPage() {
  const { reviews } = useLoaderData();

  return (
    <Page title="Product Reviews">
      <BlockStack gap="400">
        {reviews.length === 0 && <Card><p>No reviews yet.</p></Card>}
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </BlockStack>
    </Page>
  );
}