import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const body = await request.json();
    const { id, actionType } = body;

    if (!id || !actionType) {
      return new Response(JSON.stringify({ error: "Missing id or actionType" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const status = actionType === "approve" ? "approved" : "rejected";

    await db.review.update({
      where: { id, shop: session.shop },
      data: { status },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🔥 Approve action error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
