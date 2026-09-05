import { authenticate } from "../shopify.server";

const ADMIN_SHOP = "reviewnest-dev.myshopify.com";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  if (session.shop !== ADMIN_SHOP) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    shop: session.shop,
  };
};

export default function AdminPage() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>ReviewNest Admin</h1>
      <p>Owner access confirmed.</p>
    </div>
  );
}