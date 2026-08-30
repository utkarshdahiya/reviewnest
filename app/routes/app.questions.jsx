import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  TextField,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const questions = await db.question.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return { questions };
};

export const action = async ({ request }) => {
  try {
    // 1. Log all form data to Railway logs
    const formData = await request.formData();
    console.log("📦 Form data received:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // 2. Authenticate
    const { session } = await authenticate.admin(request);
    console.log("✅ Authenticated shop:", session.shop);

    // 3. Extract fields
    const id = formData.get("id");
    const actionType = formData.get("actionType");

    // 4. Validate
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!actionType) {
      return new Response(
        JSON.stringify({ error: "Missing actionType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Process action
    if (actionType === "answer") {
      const answerText = formData.get("answerText");
      if (!answerText) {
        return new Response(
          JSON.stringify({ error: "Answer text required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      await db.question.update({
        where: { id: id }, // id is a cuid (string)
        data: { answerText, status: "answered" },
      });
    } else if (actionType === "reject") {
      await db.question.update({
        where: { id: id },
        data: { status: "rejected" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid actionType: ${actionType}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 Action error:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function QuestionRow({ question }) {
  const fetcher = useFetcher();
  const [answerText, setAnswerText] = useState(question.answerText || "");

  const submitAnswer = () => {
    fetcher.submit(
      { id: question.id, actionType: "answer", answerText },
      { method: "post" }
    );
  };

  const reject = () => {
    fetcher.submit(
      { id: question.id, actionType: "reject" },
      { method: "post" }
    );
  };

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <BlockStack gap="050">
            <p><strong>{question.authorName}</strong> asked about product {question.productId}</p>
            <p>{question.questionText}</p>
          </BlockStack>
          <Badge tone={
            question.status === "answered" ? "success" :
            question.status === "rejected" ? "critical" : "attention"
          }>
            {question.status}
          </Badge>
        </InlineStack>
        <TextField
          label="Answer"
          value={answerText}
          onChange={setAnswerText}
          multiline={2}
          autoComplete="off"
        />
        <InlineStack gap="200">
          <Button onClick={submitAnswer} variant="primary">Save answer</Button>
          <Button onClick={reject} tone="critical">Reject</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

export default function QuestionsPage() {
  const { questions } = useLoaderData();

  return (
    <Page title="Customer Questions">
      <BlockStack gap="400">
        {questions.length === 0 && <Card><p>No questions yet.</p></Card>}
        {questions.map((q) => (
          <QuestionRow key={q.id} question={q} />
        ))}
      </BlockStack>
    </Page>
  );
}