import { useState } from "react";
import { useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Badge,
  BlockStack,
  InlineStack,
  Text,
  Tabs,
  Thumbnail,
  EmptyState,
  IndexTable,
  useIndexResourceState,
  Icon,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const BRAND_GREEN = "#3F8A63";

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

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
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
        width: 36, height: 36, borderRadius: 10, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
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
    star, count: reviews.filter((r) => r.rating === star).length,
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
              <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" fill="#F6A623" />
            </svg>
            <div style={{ flex: 1, height: 6, background: "#EDEDED", borderRadius: 4 }}>
              <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: BRAND_GREEN, borderRadius: 4 }} />
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

function Avatar({ name, size = 40 }) {
  const colors = ["#7C3AED", "#DB2777", "#0891B2", "#D97706", "#16A34A", "#DC2626"];
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const colorIndex = letter.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: colors[colorIndex],
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function ReviewsTable({ reviews, onStatusChange }) {
  const resourceName = { singular: "review", plural: "reviews" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(reviews);

  const rows = reviews.map((review, index) => {
    const tone =
      review.status === "approved" ? "success" :
      review.status === "rejected" ? "critical" : "attention";

    return (
      <IndexTable.Row
        id={review.id}
        key={review.id}
        selected={selectedResources.includes(review.id)}
        position={index}
      >
        <IndexTable.Cell>
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Avatar name={review.authorName} size={32} />
            <BlockStack gap="050">
              <InlineStack gap="150" blockAlign="center">
                <Text as="span" fontWeight="semibold">{review.authorName || "Anonymous"}</Text>
                {review.imageUrl && <Badge tone="info" size="small">Photo</Badge>}
              </InlineStack>
              {review.title && <Text as="span" variant="bodySm">{review.title}</Text>}
              <Text as="span" variant="bodySm" tone="subdued" truncate>
                {review.body}
              </Text>
            </BlockStack>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
  <InlineStack gap="200" blockAlign="center">
    <div style={{
      width: 32, height: 32, borderRadius: 6, background: "#F1F1F1",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontSize: 14 }}>📦</span>
    </div>
    <Text as="span" variant="bodySm">Product {review.productId}</Text>
  </InlineStack>
</IndexTable.Cell>
          <BlockStack gap="050">
            <Stars rating={review.rating} />
            <Text as="span" variant="bodySm" tone="subdued">{review.rating.toFixed(1)}</Text>
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodySm">{formatDate(review.createdAt)}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={tone}>{review.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
  <InlineStack gap="100">
    <button
      onClick={(e) => { e.stopPropagation(); onStatusChange(review.id, "approve"); }}
      disabled={review.status === "approved"}
      style={{
        border: "1px solid #E1E1E1", background: "white", borderRadius: 6, width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        opacity: review.status === "approved" ? 0.3 : 1,
      }}
      title="Approve"
    >
      <Icon source={CheckIcon} tone="success" />
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onStatusChange(review.id, "reject"); }}
      disabled={review.status === "rejected"}
      style={{
        border: "1px solid #E1E1E1", background: "white", borderRadius: 6, width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        opacity: review.status === "rejected" ? 0.3 : 1,
      }}
      title="Reject"
    >
      <Icon source={XIcon} tone="critical" />
    </button>
  </InlineStack>
</IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={reviews.length}
      selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
      onSelectionChange={handleSelectionChange}
      headings={[
        { title: "Review" },
        { title: "Product" },
        { title: "Rating" },
        { title: "Received" },
        { title: "Status" },
        { title: "Action" },
      ]}
    >
      {rows}
    </IndexTable>
  );
}

export default function ReviewsPage() {
  const { reviews: initialReviews } = useLoaderData();
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "all", content: "All" },
    { id: "pending", content: "Pending" },
    { id: "approved", content: "Approved" },
    { id: "rejected", content: "Rejected" },
  ];

  const statusFilter = tabs[selectedTab].id;
  const filteredReviews =
    statusFilter === "all" ? reviews : reviews.filter((r) => r.status === statusFilter);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const decidedCount = reviews.filter((r) => r.status !== "pending").length;
  const responseRate = reviews.length ? Math.round((decidedCount / reviews.length) * 100) : 0;

  const handleStatusChange = async (id, actionType) => {
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actionType }),
    });
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: actionType === "approve" ? "approved" : "rejected" } : r
        )
      );
    } else {
      alert("Failed to update review status");
    }
  };

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

        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">Moderation queue</Text>
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
            <Card padding="0">
              <ReviewsTable reviews={filteredReviews} onStatusChange={handleStatusChange} />
            </Card>
          )}
        </BlockStack>
      </BlockStack>
    </Page>
  );
}
