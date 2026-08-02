import { authenticate } from "../shopify.server";
import db from "../db.server";

// How many days to wait after fulfillment before sending the review request
const DELAY_DAYS = 7;

export const action = async ({ request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  // payload is the Shopify Order object (since topic = orders/fulfilled)
  const order = payload;

  const customerEmail = order.email || order.customer?.email;
  const customerName =
    order.customer?.first_name || order.shipping_address?.first_name || "there";

  if (!customerEmail) {
    // No email to send to, nothing to do
    return new Response();
  }

  const sendAfter = new Date();
  sendAfter.setDate(sendAfter.getDate() + DELAY_DAYS);

  const lineItems = order.line_items || [];

  for (const item of lineItems) {
    if (!item.product_id) continue;

    await db.reviewRequest.create({
      data: {
        shop,
        orderId: String(order.id),
        productId: String(item.product_id),
        productTitle: item.title || "your recent purchase",
        customerEmail,
        customerName,
        sendAfter,
      },
    });
  }

  return new Response();
};