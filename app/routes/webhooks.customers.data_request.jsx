import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[GDPR] Received ${topic} for shop: ${shop}`);

  if (topic === "customers/data_request") {
    const reviews = await prisma.review.findMany({ where: { shop } });
    const questions = await prisma.question.findMany({ where: { shop } });

    console.log(`[GDPR] Data request for ${shop}:`, {
      reviewsCount: reviews.length,
      questionsCount: questions.length,
    });
  }

  return json({ success: true });
};
