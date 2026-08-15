import { authenticate } from "../shopify.server";
import db from "../db.server";

// Shopify requires apps to delete a specific customer's data when asked,
// typically 10 days after the customer's request.
export const action = async ({ request }) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const customerEmail = payload.customer?.email;

  if (customerEmail) {
    const deleted = await db.reviewRequest.deleteMany({
      where: { shop, customerEmail },
    });
    console.log(`Deleted ${deleted.count} ReviewRequest record(s) for ${customerEmail} on ${shop}.`);
  }

  return new Response();
};