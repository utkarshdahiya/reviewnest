import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const settings = await db.shopSettings.findUnique({
      where: { shop: session.shop },
    }) || { plan: "starter" };

    return {
      shop: session.shop,
      currentPlan: settings.plan || "starter",
    };
  } catch (error) {
    return new Response("Authentication failed", { status: 401 });
  }
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const plan = formData.get("plan");
    const { session } = await authenticate.admin(request);

    if (!plan) {
      return new Response("Missing plan", { status: 400 });
    }

    await db.shopSettings.upsert({
      where: { shop: session.shop },
      update: { plan },
      create: { shop: session.shop, plan },
    });

    return new Response(JSON.stringify({ ok: true, plan }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

function PricingCard({ plan, price, features, isCurrentPlan, onSelect }) {
  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="100">
          <Text as="h3" variant="headingMd">{plan}</Text>
          <InlineStack gap="100" blockAlign="baseline">
            <Text as="p" variant="headingLgl">${price}</Text>
            <Text as="p" variant="bodySm" tone="subdued">/ month</Text>
          </InlineStack>
        </BlockStack>

        <BlockStack gap="200">
          {features.map((feature, i) => (
            <InlineStack key={i} gap="200" blockAlign="center">
              <div style={{ color: BRAND_GREEN }}>✓</div>
              <Text as="p" variant="bodyMd">{feature}</Text>
            </InlineStack>
          ))}
        </BlockStack>

        <Button
          variant={isCurrentPlan ? "secondary" : "primary"}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? "Current Plan" : "Choose Plan"}
        </Button>
      </BlockStack>
    </Card>
  );
}

const BRAND_GREEN = "#3F8A63";

export default function BillingPage() {
  const { currentPlan } = useLoaderData();
  const fetcher = useFetcher();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectPlan = (plan) => {
    setIsUpdating(true);
    fetcher.submit(
      { plan },
      { method: "POST" }
    );
  };

  // Listen for action completion
  if (fetcher.state === "idle" && fetcher.data) {
    // we would normally use a redirect or a state update here
    // for simplicity in this demo, we'll just alert
    if (fetcher.data.ok) {
      alert(`Successfully upgraded to ${fetcher.data.plan}!`);
      window.location.reload();
    }
  }

  return (
    <Page title="Billing & Plans">
      <BlockStack gap="500">
        <Banner tone="info">
          <p>Select a plan that fits your business. Your changes will be applied immediately to your review limits.</p>
        </Banner>

        <Layout>
          <Layout.Section variant="oneThird">
            <PricingCard
              plan="Starter"
              price="0"
              features={["First 10 reviews free", "Basic admin panel", "Standard support"]}
              isCurrentPlan={currentPlan === "starter"}
              onSelect={handleSelectPlan}
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <PricingCard
              plan="Pro"
              price="4.99"
              features={["Unlimited reviews", "Remove Branding", "Photo reviews", "Priority support"]}
              isCurrentPlan={currentPlan === "pro"}
              onSelect={handleSelectPlan}
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <PricingCard
              plan="Elite"
              price="9.99"
              features={["Everything in Pro", "Bulk CSV Imports", "Custom themes", "Dedicated account manager"]}
              isCurrentPlan={currentPlan === "elite"}
              onSelect={handleSelectPlan}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
