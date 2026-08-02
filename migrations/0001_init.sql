CREATE TABLE Review (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop TEXT NOT NULL,
  productId TEXT NOT NULL,
  authorName TEXT NOT NULL,
  rating INTEGER NOT NULL,
  title TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  imageUrl TEXT,
  videoUrl TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ShopSettings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop TEXT NOT NULL UNIQUE,
  allowPhoto INTEGER NOT NULL DEFAULT 1,
  allowVideo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE ReviewRequest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop TEXT NOT NULL,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productTitle TEXT,
  customerEmail TEXT NOT NULL,
  customerName TEXT,
  sendAfter TEXT NOT NULL,
  sentAt TEXT
);

CREATE TABLE Question (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop TEXT NOT NULL,
  productId TEXT NOT NULL,
  authorName TEXT NOT NULL,
  questionText TEXT NOT NULL,
  answerText TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_shop_product ON Review(shop, productId);
CREATE INDEX idx_question_shop_product ON Question(shop, productId);
CREATE INDEX idx_reviewrequest_sendafter ON ReviewRequest(sendAfter);
