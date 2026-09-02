import { Resend } from "resend";
import db from "../db.server";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeShopDomain(shop) {
  if (!shop) {
    return "";
  }

  return String(shop)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export const action = async ({ request }) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (
    !secret ||
    !process.env.CRON_SECRET ||
    secret !== process.env.CRON_SECRET
  ) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error(
      "RESEND_API_KEY is not configured."
    );

    return new Response(
      JSON.stringify({
        error: "Email service is not configured.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const now = new Date();

  const dueRequests =
    await db.reviewRequest.findMany({
      where: {
        sentAt: null,
        sendAfter: {
          lte: now,
        },
      },
      orderBy: {
        sendAfter: "asc",
      },
      take: 50,
    });

  let sentCount = 0;

  for (const req of dueRequests) {
    try {
      const shopDomain =
        normalizeShopDomain(req.shop);

      if (!shopDomain) {
        console.error(
          `Invalid shop for review request ${req.id}`
        );

        continue;
      }

      /*
       * Shopify product URLs cannot safely be generated
       * from the numeric product ID alone.
       *
       * Therefore this uses the Shopify storefront's
       * product path fallback only when a handle is not
       * available in ReviewRequest.
       *
       * Recommended next step: store productHandle in
       * ReviewRequest from the orders/fulfilled webhook.
       */
      const productUrl =
        `https://${shopDomain}/products`;

      const customerName =
        escapeHtml(req.customerName || "there");

      const productTitle =
        escapeHtml(
          req.productTitle ||
            "your recent purchase"
        );

      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "onboarding@resend.dev",

        to: req.customerEmail,

        subject:
          `How's your ${req.productTitle || "recent purchase"}?`,

        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;">
            <p>Hi ${customerName},</p>

            <p>
              Thanks for your recent purchase of
              <strong>${productTitle}</strong>!
            </p>

            <p>
              We'd love to hear what you think.
              Could you leave a quick review?
            </p>

            <p>
              <a
                href="${productUrl}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#202223;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                "
              >
                Leave a review
              </a>
            </p>

            <p>
              Thank you for shopping with us.
            </p>
          </div>
        `,
      });

      await db.reviewRequest.update({
        where: {
          id: req.id,
        },
        data: {
          sentAt: new Date(),
        },
      });

      sentCount++;
    } catch (error) {
      console.error(
        `Failed to send review request ${req.id}:`,
        error
      );
    }
  }

  return new Response(
    JSON.stringify({
      sent: sentCount,
      processed: dueRequests.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
