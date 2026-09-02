import { authenticate } from "../shopify.server";
import db from "../db.server";

const DELAY_DAYS = 7;

export const action = async ({ request }) => {
  const { shop, payload } =
    await authenticate.webhook(request);

  try {
    const order = payload;

    const customerEmail =
      order.email ||
      order.customer?.email ||
      order.shipping_address?.email;

    const customerName =
      order.customer?.first_name ||
      order.shipping_address?.first_name ||
      "there";

    if (!customerEmail) {
      console.log(
        `ReviewNest: order ${order.id} has no customer email`
      );

      return new Response(null, { status: 204 });
    }

    const orderId = String(order.id);

    const sendAfter = new Date();
    sendAfter.setDate(
      sendAfter.getDate() + DELAY_DAYS
    );

    const lineItems = order.line_items || [];

    for (const item of lineItems) {
      if (!item.product_id) {
        continue;
      }

      const productId = String(item.product_id);

      /*
       * Prevent duplicate review requests when Shopify
       * retries the webhook.
       */
      const existing =
        await db.reviewRequest.findFirst({
          where: {
            shop,
            orderId,
            productId,
          },
        });

      if (existing) {
        console.log(
          `ReviewNest: review request already exists for ${orderId}/${productId}`
        );

        continue;
      }

      await db.reviewRequest.create({
        data: {
          shop,
          orderId,
          productId,
          productTitle:
            item.title ||
            "your recent purchase",
          customerEmail,
          customerName,
          sendAfter,
        },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error(
      "ReviewNest orders/fulfilled webhook error:",
      error
    );

    /*
     * Throwing causes Shopify to retry the webhook,
     * which is preferable to silently losing review requests.
     */
    throw error;
  }
};
