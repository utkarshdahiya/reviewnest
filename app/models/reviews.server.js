import db from "../db.server";

export async function getReviewsForShop(shop) {
  return db.review.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApprovedReviewsForProduct(shop, productId) {
  return db.review.findMany({
    where: { shop, productId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview({ shop, productId, authorName, rating, title, body, imageUrl, videoUrl }) {
  return db.review.create({
    data: {
      shop,
      productId,
      authorName,
      rating,
      title,
      body,
      status: "pending",
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
    },
  });
}

export async function setReviewStatus(id, status) {
  return db.review.update({
    where: { id },
    data: { status },
  });
}

export async function getAverageRating(shop, productId) {
  const reviews = await getApprovedReviewsForProduct(shop, productId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

export async function getShopSettings(shop) {
  const existing = await db.shopSettings.findUnique({ where: { shop } });
  if (existing) return existing;
  return { shop, allowPhoto: false, allowVideo: false };
}

export async function updateShopSettings(shop, { allowPhoto, allowVideo }) {
  return db.shopSettings.upsert({
    where: { shop },
    update: { allowPhoto, allowVideo },
    create: { shop, allowPhoto, allowVideo },
  });
}