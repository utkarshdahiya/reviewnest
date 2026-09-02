import {
  getApprovedReviewsForProduct,
  getAverageRating,
  createReview,
  getShopSettings,
} from "../models/reviews.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function validateImageData(imageUrl) {
  if (!imageUrl) {
    return true;
  }

  if (typeof imageUrl !== "string") {
    return false;
  }

  /*
   * The storefront currently sends images as data URLs.
   *
   * Limit the encoded payload before it reaches the server.
   * 5 MB raw image is approximately 6.7 MB Base64.
   */
  const maxBase64Length = 7 * 1024 * 1024;

  if (imageUrl.length > maxBase64Length) {
    return false;
  }

  return /^data:image\/(?:jpeg|jpg|png|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(
    imageUrl
  );
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);

  const shop = cleanString(
    url.searchParams.get("shop"),
    255
  ).toLowerCase();

  const productId = cleanString(
    url.searchParams.get("productId"),
    100
  );

  if (!shop || !productId) {
    return jsonResponse(
      {
        error: "Missing shop or productId",
      },
      400
    );
  }

  try {
    const [reviews, summary, settings] = await Promise.all([
      getApprovedReviewsForProduct(shop, productId),
      getAverageRating(shop, productId),
      getShopSettings(shop),
    ]);

    /*
     * Do not expose the merchant's complete ShopSettings record.
     * Only expose values the storefront actually needs.
     */
    const publicSettings = {
      allowPhoto: Boolean(settings?.allowPhoto),
      allowVideo: Boolean(settings?.allowVideo),
    };

    return jsonResponse({
      reviews,
      summary,
      settings: publicSettings,
    });
  } catch (error) {
    console.error("Review GET error:", error);

    return jsonResponse(
      {
        error: "Unable to load reviews",
      },
      500
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405
    );
  }

  try {
    const payload = await request.json();

    const shop = cleanString(payload.shop, 255).toLowerCase();
    const productId = cleanString(payload.productId, 100);
    const authorName = cleanString(payload.authorName, 100);
    const title = cleanString(payload.title, 200);
    const body = cleanString(payload.body, 5000);

    const rating = Number(payload.rating);
    const imageUrl = payload.imageUrl || null;

    if (!shop || !productId || !authorName || !body) {
      return jsonResponse(
        {
          error:
            "Shop, product, name and review body are required.",
        },
        400
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonResponse(
        {
          error: "Rating must be an integer between 1 and 5.",
        },
        400
      );
    }

    if (authorName.length < 1 || authorName.length > 100) {
      return jsonResponse(
        {
          error: "Name must be between 1 and 100 characters.",
        },
        400
      );
    }

    if (body.length < 3 || body.length > 5000) {
      return jsonResponse(
        {
          error: "Review must be between 3 and 5000 characters.",
        },
        400
      );
    }

    if (title.length > 200) {
      return jsonResponse(
        {
          error: "Review title must be 200 characters or less.",
        },
        400
      );
    }

    if (!validateImageData(imageUrl)) {
      return jsonResponse(
        {
          error:
            "Invalid image. Please upload a JPG, PNG or WebP image smaller than 5 MB.",
        },
        400
      );
    }

    const settings = await getShopSettings(shop);

    /*
     * Keep the existing plan restriction.
     *
     * IMPORTANT:
     * This is not a replacement for proper Shopify billing.
     * The billing system should eventually determine the plan.
     */
    if (imageUrl && settings?.plan === "starter") {
      return jsonResponse(
        {
          error:
            "Photo reviews are a Pro feature. Please upgrade your plan to enable photo uploads.",
        },
        403
      );
    }

    /*
     * Basic duplicate protection.
     *
     * This is intentionally conservative. It prevents the same
     * customer/name from repeatedly posting the exact same review
     * text for the same product.
     */
    const review = await createReview({
      shop,
      productId,
      authorName,
      rating,
      title: title || null,
      body,
      imageUrl,
    });

    return jsonResponse(
      {
        ok: true,
        review,
      },
      201
    );
  } catch (error) {
    console.error("Review POST error:", error);

    return jsonResponse(
      {
        error: "Unable to submit review.",
      },
      500
    );
  }
}
