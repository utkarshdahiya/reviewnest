import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page,
  Card,
  Badge,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  // TEST: force error to confirm loader runs


  try {
    const { session } = await authenticate.admin(request);
    console.log("✅ Loader: Authenticated shop:", session.shop);

    const reviews = await db.review.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
    });
    console.log(`✅ Loader: Found ${reviews.length} reviews`);

    return { reviews };
  } catch (error) {
    console.error("🔥 Loader error:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const action = async ({ request }) => {
  try {
    console.log("📦 Action: Request received. Content-Type:", request.headers.get("Content-Type"));

    let data;
    if (request.headers.get("Content-Type")?.includes("application/json")) {
      data = await request.json();
      console.log("📦 Action: JSON data received:", data);
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
      console.log("📦 Action: Form data received:", data);
    }

    const { session } = await authenticate.admin(request);
    console.log("✅ Action: Authenticated shop:", session.shop);

    const id = data.id;
    const actionType = data.actionType;

    if (!id) {
      console.error("❌ Action Error: Missing id", data);
      return new Response(
        JSON.stringify({ error: "Missing id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!actionType) {
      console.error("❌ Action Error: Missing actionType", data);
      return new Response(
        JSON.stringify({ error: "Missing actionType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (actionType === "approve") {
      await db.review.update({
        where: { id: id },
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
        <BlockStack gap="050">
          <p>
            <strong>{review.authorName}</strong> rated {review.rating}★ for product {review.productId}
          </p>
          <p>{review.body}</p>
        </BlockStack>
        <Badge tone={
          review.status === "approved" ? "success" :
          review.status === "rejected" ? "critical" : "attention"
        }>
          {review.status}
        </Badge>
        <InlineStack gap="200">
          <Button onClick={approve} variant="primary">Approve</Button>
          <Button onClick={reject} tone="critical">Reject</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

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