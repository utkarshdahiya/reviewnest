import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[GDPR] Received ${topic} for shop: ${shop}`);

  if (topic === "shop/redact") {
    await prisma.review.deleteMany({ where: { shop } });
    await prisma.question.deleteMany({ where: { shop } });
    await prisma.reviewRequest.deleteMany({ where: { shop } });
    await prisma.shopSettings.deleteMany({ where: { shop } });
    await prisma.session.deleteMany({ where: { shop } });

    console.log(`[GDPR] Deleted all data for shop: ${shop}`);
  }

  return json({ success: true });
};
