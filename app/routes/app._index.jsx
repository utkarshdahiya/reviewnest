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
  Icon,
  Divider,
} from "@shopify/polaris";
import { StarFilledIcon } from "@shopify/polaris-icons";
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

function Stars({ rating }) {
  return (
    <InlineStack gap="050">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ opacity: i <= rating ? 1 : 0.25 }}>
          <Icon source={StarFilledIcon} tone="warning" />
        </span>
      ))}
    </InlineStack>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
        <Text as="p" variant="headingLg">{value}</Text>
      </BlockStack>
    </Card>
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

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h3" variant="headingSm">{review.authorName || "Anonymous"}</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Product {review.productId}
            </Text>
          </BlockStack>
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
            <StatCard label="Total reviews" value={reviews.length} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Average rating" value={`${avgRating} ★`} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Pending approval" value={pendingCount} />
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
