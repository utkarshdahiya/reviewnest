import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[GDPR] Received ${topic} for shop: ${shop}`);

  if (topic === "customers/redact") {
    console.log(`[GDPR] Customer redact request for shop: ${shop} - no customer PII stored`);
  }

  return json({ success: true });
};
