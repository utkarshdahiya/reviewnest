import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const ADMIN_SHOP = "reviewnest-dev.myshopify.com";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);

  if (session.shop !== ADMIN_SHOP) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();

  const shop = String(formData.get("shop") || "")
    .trim()
    .toLowerCase();

  const specialAccess =
    String(formData.get("specialAccess") || "") === "true";

  if (!shop) {
    throw new Response("Missing shop.", { status: 400 });
  }

  const shopExists = await db.session.findFirst({
    where: { shop },
    select: { shop: true },
  });

  if (!shopExists) {
    throw new Response("Store not found.", { status: 404 });
  }

  await db.shopSettings.upsert({
    where: { shop },
    update: {
      specialAccess,
    },
    create: {
      shop,
      allowPhoto: false,
      allowVideo: false,
      autoApprove: false,
      specialAccess,
      plan: "starter",
    },
  });

  return redirect("/app/admin");
}