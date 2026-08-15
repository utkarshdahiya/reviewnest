import { authenticate } from "../shopify.server";
import db from "../db.server";

// Shopify calls this 48 hours after an app is uninstalled — all shop data
// must be deleted, not just the session (webhooks.app.uninstalled.jsx
// only clears sessions; this clears everything else).
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await db.review.deleteMany({ where: { shop } });
  await db.question.deleteMany({ where: { shop } });
  await db.reviewRequest.deleteMany({ where: { shop } });
  await db.shopSettings.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });

  console.log(`All data for ${shop} has been deleted per shop/redact.`);

  return new Response();
};