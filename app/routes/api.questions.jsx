import { json } from "@remix-run/node";
import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return json(
      { error: "shop and productId are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const questions = await db.question.findMany({
    where: {
      shop,
      productId,
      status: "answered",
    },
    select: {
      id: true,
      questionText: true,
      answerText: true,
      authorName: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json(
    { questions },
    { headers: CORS_HEADERS }
  );
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json();

    const {
      shop,
      productId,
      authorName,
      questionText,
    } = body;

    if (!shop || !productId || !questionText) {
      return json(
        { error: "Missing required fields" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (typeof questionText !== "string" || questionText.length > 2000) {
      return json(
        { error: "Question is too long" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const question = await db.question.create({
      data: {
        shop,
        productId: String(productId),
        authorName:
          typeof authorName === "string"
            ? authorName.slice(0, 100)
            : "Anonymous",
        questionText: questionText.trim(),
        status: "pending",
      },
    });

    return json(
      {
        ok: true,
        questionId: question.id,
      },
      {
        status: 201,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("Question API error:", error);

    return json(
      { error: "Unable to submit question" },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
