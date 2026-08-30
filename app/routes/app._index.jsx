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

const BRAND_GREEN = "#0F3D2E";

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

function Stars({ rating, size = 18 }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"
            fill={i <= rating ? "#F6A623" : "#E2E2E2"}
          />
        </svg>
      ))}
    </div>
  );
}

function IconBadge({ emoji, bg }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
      }}
    >
      {emoji}
    </div>
  );
}

function StatCard({ label, value, sub, emoji, bg }) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
          <IconBadge emoji={emoji} bg={bg} />
        </InlineStack>
        <InlineStack gap="150" blockAlign="baseline">
          <Text as="p" variant="heading2xl">{value}</Text>
          {sub && <Text as="p" variant="bodySm" tone="subdued">{sub}</Text>}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function RatingBreakdown({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="050">
          <Text as="h3" variant="headingSm">Rating breakdown</Text>
          <Text as="p" variant="bodySm" tone="subdued">How customers are rating you</Text>
        </BlockStack>
        {counts.map(({ star, count }) => (
          <InlineStack key={star} gap="200" blockAlign="center" wrap={false}>
            <div style={{ width: 14 }}><Text as="span" variant="bodySm">{star}</Text></div>
            <svg width="16" height="16" viewBox="0 0 20 20">
              <path
                d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"
                fill="#F6A623"
              />
            </svg>
            <div style={{ flex: 1, height: 6, background: "#EDEDED", borderRadius: 4 }}>
              <div
                style={{
                  width: `${(count / max) * 100}%`,
                  height: "100%",
                  background: BRAND_GREEN,
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ width: 24, textAlign: "right" }}>
              <Text as="span" variant="bodySm" tone="subdued">{count}</Text>
            </div>
          </InlineStack>
        ))}
      </BlockStack>
    </Card>
  );
}

function ActivityChart({ reviews }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const counts = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return reviews.filter((r) => {
      const created = new Date(r.createdAt);
      return created >= day && created < next;
    }).length;
  });

  const max = Math.max(1, ...counts);

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="050">
          <Text as="h3" variant="headingSm">Review activity</Text>
          <Text as="p" variant="bodySm" tone="subdued">Reviews received over the last 7 days</Text>
        </BlockStack>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
          {counts.map((count, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(6, (count / max) * 90)}px`,
                  background: i === counts.length - 1 ? BRAND_GREEN : "#B7D9C9",
                  borderRadius: 4,
                }}
              />
              <Text as="span" variant="bodyXs" tone="subdued">
                {days[i].toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </Text>
            </div>
          ))}
        </div>
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
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const decidedCount = reviews.filter((r) => r.status !== "pending").length;
  const responseRate = reviews.length
    ? Math.round((decidedCount / reviews.length) * 100)
    : 0;

  return (
    <Page title="Product Reviews" subtitle="Manage and moderate customer feedback">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard label="Total reviews" value={reviews.length} emoji="📥" bg="#DFF3E8" />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Average rating" value={avgRating} sub="out of 5.0" emoji="⭐" bg="#FDF0DA" />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Needs attention" value={pendingCount} sub="to review" emoji="💬" bg="#FDF0DA" />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <StatCard label="Published" value={approvedCount} sub="on storefront" emoji="✅" bg="#DFF3E8" />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <StatCard label="Response rate" value={`${responseRate}%`} sub="of all reviews" emoji="📨" bg="#E1EBFA" />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <ActivityChart reviews={reviews} />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <RatingBreakdown reviews={reviews} />
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
