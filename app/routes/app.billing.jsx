import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Banner,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
  };
};

function Feature({ children }) {
  return (
    <InlineStack gap="200" blockAlign="center">
      <Text as="span" variant="bodyMd">
        ✓
      </Text>
      <Text as="span" variant="bodyMd">
        {children}
      </Text>
    </InlineStack>
  );
}

function PricingCard({
  title,
  price,
  subtitle,
  features,
  featured,
}) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="100">
            <Text as="h2" variant="headingLg">
              {title}
            </Text>
            <InlineStack gap="100" blockAlign="baseline">
              <Text as="p" variant="headingXl">
                {price}
              </Text>
              {subtitle && (
                <Text as="span" tone="subdued">
                  {subtitle}
                </Text>
              )}
            </InlineStack>
          </BlockStack>

          {featured && <Badge tone="success">Best value</Badge>}
        </InlineStack>

        <Divider />

        <BlockStack gap="250">
          {features.map((feature) => (
            <Feature key={feature}>{feature}</Feature>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

export default function BillingPage() {
  return (
    <Page title="Plans">
      <BlockStack gap="500">
        <Banner tone="info">
          <p>
            Choose the plan that fits your store. Pricing shown below is for
            ReviewNest and does not include a payment flow yet.
          </p>
        </Banner>

        <Layout>
          <Layout.Section variant="oneHalf">
            <PricingCard
              title="Free"
              price="$0"
              subtitle="forever"
              features={[
                "First 10 reviews",
                "Review collection",
                "Review widget/display",
                "Basic moderation",
                "Photo reviews",
                "Auto Approval",
              ]}
            />
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <PricingCard
              title="Growth Lifetime"
              price="$19"
              subtitle="one-time"
              featured
              features={[
                "Unlimited reviews",
                "Photo reviews",
                "Remove ReviewNest branding",
                "Lifetime access",
                "No monthly subscription",
              ]}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}