import { data } from "react-router";
import { useLoaderData, useSubmit } from "react-router";
import { Page, Card, DataTable, Badge, Button, ButtonGroup, EmptyState, Checkbox, BlockStack, Text, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getReviewsForShop, setReviewStatus, getShopSettings, updateShopSettings } from "../models/reviews.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const reviews = await getReviewsForShop(session.shop);
  const settings = await getShopSettings(session.shop);
  return data({ reviews, settings });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "updateSettings") {
    const allowPhoto = formData.get("allowPhoto") === "true";
    await updateShopSettings(session.shop, { allowPhoto });
    return data({ ok: true });
  }

  const reviewId = formData.get("reviewId");
  const status = formData.get("status");
  await setReviewStatus(reviewId, status);
  return data({ ok: true });
}

export default function ReviewsAdmin() {
  const { reviews, settings } = useLoaderData();
  const submit = useSubmit();

  const handleSettingsChange = (field, value) => {
    submit(
      {
        actionType: "updateSettings",
        allowPhoto: field === "allowPhoto" ? value : settings.allowPhoto,
      },
      { method: "post" }
    );
  };

  const rows = reviews.map((r) => [
    r.productId,
    r.authorName,
    "★".repeat(r.rating),
    r.body,
    r.imageUrl ? <Thumbnail key={`img-${r.id}`} source={r.imageUrl} alt="Review photo" size="small" /> : "—",
    <Badge key={`badge-${r.id}`} tone={r.status === "approved" ? "success" : r.status === "rejected" ? "critical" : "attention"}>
      {r.status}
    </Badge>,
    <ButtonGroup key={`actions-${r.id}`}>
      <Button size="slim" onClick={() => submit({ reviewId: r.id, status: "approved" }, { method: "post" })}>
        Approve
      </Button>
      <Button size="slim" tone="critical" onClick={() => submit({ reviewId: r.id, status: "rejected" }, { method: "post" })}>
        Reject
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page title="Product Reviews">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">Review settings</Text>
            <Checkbox
              label="Allow customers to attach a photo to their review"
              checked={settings.allowPhoto}
              onChange={(value) => handleSettingsChange("allowPhoto", value)}
            />
          </BlockStack>
        </Card>

        <Card>
          {reviews.length === 0 ? (
            <EmptyState
              heading="No reviews yet"
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              action={{ content: "Add the review widget to your theme", url: "shopify://admin/themes/current/editor" }}
            >
              <p>Once the review widget is added to your product pages, customer reviews will show up here for you to approve or reject.</p>
            </EmptyState>
          ) : (
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text", "text", "text"]}
              headings={["Product", "Customer", "Rating", "Review", "Photo", "Status", "Actions"]}
              rows={rows}
            />
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}