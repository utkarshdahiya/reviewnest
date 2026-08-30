import db from "../db.server";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
};

export const loader = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { 
            status: 204, 
            headers: { "Content-Type": "application/json" }
        });
    }
    
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const productId = url.searchParams.get("productId");
    
    if (!shop || !productId) {
        return new Response(JSON.stringify({ error: "Missing Shop or Product ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    const questions = await db.question.findMany({
        where: { shop, productId, status: "APPROVED" }, // adjust as needed
        select: { question: true }
    });
    
    return new Response(JSON.stringify({ questions }), { 
        headers: { "Content-Type": "application/json" }
    });
};

// Minimal action – you can expand later
export const action = async ({ request }) => {
    return new Response(JSON.stringify({ ok: true }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
};