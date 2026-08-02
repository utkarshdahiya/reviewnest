import { Resend } from "resend";
import db from "../db.server";

const resend = new Resend(process.env.RESEND_API_KEY);

export const action = async ({ request }) => {
  // Protect this route with our secret so random people can't trigger it
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // Find requests that are due and haven't been sent yet
  const dueRequests = await db.reviewRequest.findMany({
    where: {
      sentAt: null,
      sendAfter: { lte: now },
    },
    take: 50, // don't send too many at once
  });

  let sentCount = 0;

  for (const req of dueRequests) {
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev", // switch to your own verified domain later
        to: req.customerEmail,
        subject: `How's your ${req.productTitle}?`,
        html: `
          <p>Hi ${req.customerName},</p>
          <p>Thanks for your recent purchase of <strong>${req.productTitle}</strong>!</p>
          <p>We'd love to hear what you think. Could you leave a quick review?</p>
          <p><a href="https://${req.shop}/products">Leave a review</a></p>
        `,
      });

      await db.reviewRequest.update({
        where: { id: req.id },
        data: { sentAt: new Date() },
      });

      sentCount++;
    } catch (err) {
      console.error(`Failed to send review request ${req.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }), {
    headers: { "Content-Type": "application/json" },
  });
};