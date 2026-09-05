import { useState } from "react";
import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  Badge,
  Button,
  TextField,
  BlockStack,
  InlineStack,
  Banner,
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

function QuestionRow({ question }) {
  const [answerText, setAnswerText] = useState(question.answerText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitAction(actionType) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id: question.id,
          actionType,
          answerText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update question.");
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update question."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="100">
            <p>
              <strong>{question.authorName}</strong> asked about product{" "}
              {question.productId}
            </p>

            <p>{question.questionText}</p>
          </BlockStack>

          <Badge
            tone={
              question.status === "answered"
                ? "success"
                : question.status === "rejected"
                ? "critical"
                : "attention"
            }
          >
            {question.status}
          </Badge>
        </InlineStack>

        {error && <Banner tone="critical">{error}</Banner>}

        <TextField
          label="Answer"
          value={answerText}
          onChange={setAnswerText}
          multiline={2}
          autoComplete="off"
          disabled={loading}
        />

        <InlineStack gap="200">
          <Button
            variant="primary"
            loading={loading}
            onClick={() => submitAction("answer")}
          >
            Save answer
          </Button>

          <Button
            tone="critical"
            loading={loading}
            onClick={() => submitAction("reject")}
          >
            Reject
          </Button>
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
        {questions.length === 0 && (
          <Card>
            <p>No questions yet.</p>
          </Card>
        )}

        {questions.map((question) => (
          <QuestionRow key={question.id} question={question} />
        ))}
      </BlockStack>
    </Page>
  );
}