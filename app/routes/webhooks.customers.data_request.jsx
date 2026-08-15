import { authenticate } from "../shopify.server";
import db from "../db.server";

// Shopify requires this webhook so a merchant can respond to a customer's
// request to see what data the app has stored about them.
// We don't auto-return the data to Shopify — we log it so the merchant
// can manually fulfill the request within Shopify's required window.
export const action = async ({ request }) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const customerEmail = payload.customer?.email;

  const matchingRequests = customerEmail
    ? await db.reviewRequest.findMany({
        where: { shop, customerEmail },
      })
    : [];

  console.log(
    `Data request for customer ${customerEmail} on ${shop}: found ${matchingRequests.length} matching ReviewRequest record(s).`
  );

  return new Response();
};