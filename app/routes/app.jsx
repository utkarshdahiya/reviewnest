import { Outlet, useLoaderData, useRouteError, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={{}}>
        <div
  style={{
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  }}
>
  <Link
    to="/app"
    style={{
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
    }}
  >
    <img
      src="/reviewnest-logo.svg"
      alt="ReviewNest"
      style={{
        width: "150px",
        height: "auto",
        display: "block",
      }}
    />
  </Link>
</div>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/questions">Questions</s-link>
          <s-link href="/app/additional">Additional page</s-link>
          <s-link href="/app/billing">Billing</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
