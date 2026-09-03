
import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function corsJson(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return corsJson(
      { error: "Missing shop or productId" },
      { status: 400 }
    );
  }

  try {
    const questions = await db.question.findMany({
      where: {
        shop,
        productId: String(productId),
        status: "answered",
      },
      select: {
        id: true,
        authorName: true,
        questionText: true,
        answerText: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return corsJson({
      questions,
    });
  } catch (error) {
    console.error("Questions loader error:", error);

    return corsJson(
      { error: "Unable to load questions" },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (request.method !== "POST") {
    return corsJson(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const payload = await request.json();

    const shop =
      typeof payload.shop === "string"
        ? payload.shop.trim().toLowerCase()
        : "";

    const productId =
      typeof payload.productId === "string" ||
      typeof payload.productId === "number"
        ? String(payload.productId).trim()
        : "";

    const authorName =
      typeof payload.authorName === "string"
        ? payload.authorName.trim()
        : "";

    const questionText =
      typeof payload.questionText === "string"
        ? payload.questionText.trim()
        : "";

    if (!shop || !productId || !questionText) {
      return corsJson(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (shop.length > 255) {
      return corsJson(
        { error: "Invalid shop" },
        { status: 400 }
      );
    }

    if (productId.length > 100) {
      return corsJson(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    if (authorName.length > 100) {
      return corsJson(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (questionText.length < 3) {
      return corsJson(
        { error: "Question is too short" },
        { status: 400 }
      );
    }

    if (questionText.length > 2000) {
      return corsJson(
        { error: "Question must be 2000 characters or less" },
        { status: 400 }
      );
    }

    const question = await db.question.create({
      data: {
        shop,
        productId,
        authorName: authorName || "Anonymous",
        questionText,
        status: "pending",
      },
    });

    return corsJson(
      {
        ok: true,
        questionId: question.id,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Question creation error:", error);

    return corsJson(
      { error: "Unable to submit question" },
      { status: 500 }
    );
  }
}
