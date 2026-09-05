import { Form, useLoaderData } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const ADMIN_SHOP = "reviewnest-dev.myshopify.com";

async function requireOwner(request) {
  const { session } = await authenticate.admin(request);

  if (session.shop !== ADMIN_SHOP) {
    throw new Response("Not Found", { status: 404 });
  }

  return session;
}

export const loader = async ({ request }) => {
  await requireOwner(request);

  const sessions = await db.session.findMany({
    select: {
      shop: true,
    },
    distinct: ["shop"],
    orderBy: {
      shop: "asc",
    },
  });

  const shops = await Promise.all(
    sessions.map(async ({ shop }) => {
      const [reviewCount, settings] = await Promise.all([
        db.review.count({
          where: { shop },
        }),
        db.shopSettings.findUnique({
          where: { shop },
        }),
      ]);

      return {
        shop,
        reviewCount,
        specialAccess: Boolean(settings?.specialAccess),
      };
    })
  );

  return {
    shops,
  };
};

export const action = async ({ request }) => {
  await requireOwner(request);

  const formData = await request.formData();

  const shop = String(formData.get("shop") || "")
    .trim()
    .toLowerCase();

  const specialAccess =
    String(formData.get("specialAccess") || "") === "true";

  if (!shop) {
    throw new Response("Missing shop.", { status: 400 });
  }

  const shopExists = await db.session.findFirst({
    where: { shop },
    select: { shop: true },
  });

  if (!shopExists) {
    throw new Response("Store not found.", { status: 404 });
  }

  await db.shopSettings.upsert({
    where: { shop },
    update: {
      specialAccess,
    },
    create: {
      shop,
      allowPhoto: false,
      allowVideo: false,
      autoApprove: false,
      specialAccess,
      plan: "starter",
    },
  });

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/app/admin",
    },
  });
};

export default function AdminPage() {
  const { shops } = useLoaderData();

  return (
    <Page
      title="ReviewNest Admin"
      subtitle="Manage store access and review limits"
    >
      <BlockStack gap="400">
        <Banner tone="info">
          <p>
            This is the ReviewNest owner control panel. Special Access is
            controlled only from here.
          </p>
        </Banner>

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Store access
              </Text>

              <Text as="p" variant="bodySm" tone="subdued">
                Stores normally receive their first 10 reviews for free.
                Special Access allows a store to continue receiving reviews
                beyond that limit.
              </Text>
            </BlockStack>

            <Divider />

            {shops.length === 0 ? (
              <Text as="p" tone="subdued">
                No stores found yet.
              </Text>
            ) : (
              <BlockStack gap="300">
                {shops.map((store) => (
                  <Card key={store.shop}>
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      gap="300"
                    >
                      <BlockStack gap="100">
                        <Text
                          as="p"
                          variant="bodyMd"
                          fontWeight="semibold"
                        >
                          {store.shop}
                        </Text>

                        <InlineStack gap="200">
                          <Text as="span" variant="bodySm">
                            Reviews: {store.reviewCount}
                          </Text>

                          <Badge
                            tone={
                              store.specialAccess
                                ? "success"
                                : "attention"
                            }
                          >
                            {store.specialAccess
                              ? "Special Access ON"
                              : "10-review limit"}
                          </Badge>
                        </InlineStack>
                      </BlockStack>

                      <Form method="post">
                        <input
                          type="hidden"
                          name="shop"
                          value={store.shop}
                        />

                        <input
                          type="hidden"
                          name="specialAccess"
                          value={String(!store.specialAccess)}
                        />

                        <Button submit>
                          {store.specialAccess
                            ? "Remove Special Access"
                            : "Grant Special Access"}
                        </Button>
                      </Form>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
