import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();

    const id = String(formData.get("id") || "").trim();
    const actionType = String(formData.get("actionType") || "").trim();

    if (!id) {
      return Response.json(
        { error: "Missing question id" },
        { status: 400 }
      );
    }

    if (actionType !== "answer" && actionType !== "reject") {
      return Response.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    const question = await db.question.findFirst({
      where: {
        id,
        shop: session.shop,
      },
      select: { id: true },
    });

    if (!question) {
      return Response.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (actionType === "answer") {
      const answerText = String(
        formData.get("answerText") || ""
      ).trim();

      if (!answerText) {
        return Response.json(
          { error: "Answer text is required" },
          { status: 400 }
        );
      }

      if (answerText.length > 5000) {
        return Response.json(
          { error: "Answer must be 5000 characters or less" },
          { status: 400 }
        );
      }

      await db.question.update({
        where: { id: question.id },
        data: {
          answerText,
          status: "answered",
        },
      });
    } else {
      await db.question.update({
        where: { id: question.id },
        data: {
          status: "rejected",
        },
      });
    }

    return Response.json({
      ok: true,
      id: question.id,
      actionType,
    });
  } catch (error) {
    console.error("Admin question action error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update question",
      },
      { status: 500 }
    );
  }
}