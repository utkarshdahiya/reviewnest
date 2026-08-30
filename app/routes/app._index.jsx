import { useState } from "react";
import { useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Badge,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Tabs,
  Thumbnail,
  EmptyState,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const reviews = await db.review.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
    });
    return { reviews };
  } catch (error) {
    console.error("🔥 Loader error:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    ["year", 31536000], ["month", 2592000], ["day", 86400],
    ["hour", 3600], ["minute", 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 20 20">
          <path
            d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"
            fill={i <= rating ? "#F6A623" : "#E2E2E2"}
          />
        </svg>
      ))}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <Card>
      <BlockStack gap="150">
        <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
        <Text as="p" variant="heading2xl" tone={tone}>{value}</Text>
      </BlockStack>
    </Card>
  );
}

function Avatar({ name }) {
  const colors = ["#7C3AED", "#DB2777", "#0891B2", "#D97706", "#16A34A", "#DC2626"];
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const colorIndex = letter.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: colors[colorIndex],
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function ReviewRow({ review }) {
  const [status, setStatus] = useState(review.status);

  const updateStatus = async (actionType) => {
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: review.id, actionType }),
    });
    if (res.ok) {
      setStatus(actionType === "approve" ? "approved" : "rejected");
    } else {
      alert("Failed to update review status");
    }
  };

  const approve = () => updateStatus("approve");
  const reject = () => updateStatus("reject");

  const tone =
    status === "approved" ? "success" :
    status === "rejected" ? "critical" : "attention";

  const bgTone =
    status === "approved" ? "bg-surface-success" :
    status === "rejected" ? "bg-surface-critical" :
    "bg-surface-caution";

  return (
    <Card background={bgTone}>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            <Avatar name={review.authorName} />
            <BlockStack gap="050">
              <Text as="h3" variant="headingSm">{review.authorName || "Anonymous"}</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Product {review.productId} · {timeAgo(review.createdAt)}
              </Text>
            </BlockStack>
          </InlineStack>
          <Badge tone={tone}>{status}</Badge>
        </InlineStack>

        <Stars rating={review.rating} />

        {review.title && (
          <Text as="p" variant="headingXs">{review.title}</Text>
        )}
        <Text as="p">{review.body}</Text>

        {review.imageUrl && (
          <Thumbnail source={review.imageUrl} alt="Review photo" size="large" />
        )}

        <Divider />

        <InlineStack gap="200">
          <Button onClick={approve} variant="primary" disabled={status === "approved"}>
            Approve
          </Button>
          <Button onClick={reject} tone="critical" disabled={status === "rejected"}>
            Reject
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

export default function ReviewsPage() {
  const { reviews } = useLoaderData();
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "all", content: "All" },
    { id: "pending", content: "Pending" },
    { id: "approved", content: "Approved" },
    { id: "rejected", content: "Rejected" },
  ];

  const statusFilter = tabs[selectedTab].id;
  const filteredReviews =
    statusFilter === "all"
      ? reviews
      : reviews.filter((r) => r.status === statusFilter);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <Page title="Product Reviews" subtitle="Manage and moderate customer feedback">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard label="Total reviews" value={reviews.length} tone="base" />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Average rating" value={`${avgRating} ★`} tone="success" />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Pending approval" value={pendingCount} tone="caution" />
          </Layout.Section>
        </Layout>

        <Card padding="0">
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
        </Card>

        {filteredReviews.length === 0 ? (
          <Card>
            <EmptyState
              heading="No reviews here yet"
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            >
              <p>Once customers submit reviews, they'll show up here.</p>
            </EmptyState>
          </Card>
        ) : (
          <BlockStack gap="300">
            {filteredReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Page>
  );
}
