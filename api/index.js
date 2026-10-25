const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
const MAX_TEXT_LENGTH = 10000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// Vercel rewrites /api/v1/... to this function and passes the route in ?path=.
app.use((req, res, next) => {
  if (typeof req.query.path === "string") {
    const requestedPath = req.query.path;
    const query = { ...req.query };
    delete query.path;
    const search = new URLSearchParams(query).toString();
    req.url = requestedPath + (search ? "?" + search : "");
  } else if (req.path.startsWith("/api/v1/") || req.path === "/api/health") {
    req.url = req.url.slice(4) || "/";
  }
  next();
});

app.use("/api-assets", express.static(path.join(__dirname, "../api-assets")));
app.get("/api", (req, res) => res.sendFile(path.join(__dirname, "../api-docs.html")));
app.get("/api/docs", (req, res) => res.sendFile(path.join(__dirname, "../api-docs.html")));
app.get("/api/playground", (req, res) => res.sendFile(path.join(__dirname, "../api-docs.html")));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again in a minute." }
  }
}));

function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function readText(value, name = "text", maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") {
    return { error: name + " must be a string." };
  }
  if (value.length > maxLength) {
    return { error: name + " must be " + maxLength + " characters or fewer." };
  }
  return { value };
}

function getText(req, name = "text") {
  const value = req.method === "GET" ? req.query[name] : req.body && req.body[name];
  const result = readText(value, name);
  if (result.error) return { error: result.error };
  return { value: result.value };
}

app.get("/health", (req, res) => success(res, {
  name: "LXWIS API",
  status: "online",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

app.get("/v1", (req, res) => success(res, {
  name: "LXWIS API",
  version: "v1",
  description: "Free tools for developers.",
  documentation: "https://lxwis.site/api",
  categories: ["utilities", "images", "text", "ai", "developer", "fun"]
}));

// Utilities
app.get("/v1/utils/uuid", (req, res) => success(res, { uuid: crypto.randomUUID() }));

app.get("/v1/utils/random", (req, res) => {
  const min = req.query.min === undefined ? 1 : Number(req.query.min);
  const max = req.query.max === undefined ? 100 : Number(req.query.max);
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min > 1000000) {
    return fail(res, 400, "INVALID_RANGE", "Use whole-number min and max values with max >= min and a range no larger than 1,000,000.");
  }
  return success(res, { min, max, number: crypto.randomInt(min, max + 1) });
});

app.get("/v1/utils/password", (req, res) => {
  const length = req.query.length === undefined ? 16 : Number(req.query.length);
  if (!Number.isInteger(length) || length < 8 || length > 64) {
    return fail(res, 400, "INVALID_LENGTH", "Password length must be between 8 and 64.");
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-_";
  let password = "";
  for (let i = 0; i < length; i++) password += alphabet[crypto.randomInt(0, alphabet.length)];
  return success(res, { password, length });
});

app.get("/v1/utils/timestamp", (req, res) => {
  const input = req.query.value;
  const date = input === undefined ? new Date() : new Date(String(input));
  if (Number.isNaN(date.getTime())) return fail(res, 400, "INVALID_DATE", "Provide a valid date or timestamp in the value parameter.");
  return success(res, {
    iso: date.toISOString(),
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMilliseconds: date.getTime()
  });
});

app.get("/v1/utils/qr", async (req, res) => {
  const text = getText(req, "text");
  if (text.error) return fail(res, 400, "INVALID_INPUT", text.error);
  if (!text.value.trim()) return fail(res, 400, "INVALID_INPUT", "text cannot be empty.");
  try {
    const dataUrl = await QRCode.toDataURL(text.value, { errorCorrectionLevel: "M", margin: 2, width: 320 });
    return success(res, { dataUrl, format: "png", width: 320, height: 320 });
  } catch {
    return fail(res, 500, "QR_GENERATION_FAILED", "Could not generate the QR code.");
  }
});

// Text
app.post("/v1/text/count", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  const text = input.value;
  return success(res, {
    characters: text.length,
    charactersWithoutSpaces: text.replace(/\s/g, "").length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.length ? text.split(/\r?\n/).length : 0
  });
});

app.post("/v1/text/case", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  const text = input.value;
  const mode = req.body.mode || "upper";
  const modes = {
    upper: () => text.toUpperCase(),
    lower: () => text.toLowerCase(),
    title: () => text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()),
    sentence: () => text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, char => char.toUpperCase())
  };
  if (!modes[mode]) return fail(res, 400, "INVALID_MODE", "mode must be upper, lower, title, or sentence.");
  return success(res, { mode, result: modes[mode]() });
});

app.post("/v1/text/slug", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  const slug = input.value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return success(res, { slug });
});

app.post("/v1/text/reverse", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  return success(res, { result: Array.from(input.value).reverse().join("") });
});

app.post("/v1/text/encode", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  const mode = req.body.mode || "url-encode";
  if (mode === "url-encode") return success(res, { mode, result: encodeURIComponent(input.value) });
  if (mode === "url-decode") {
    try { return success(res, { mode, result: decodeURIComponent(input.value) }); }
    catch { return fail(res, 400, "INVALID_ENCODING", "The text is not valid URL-encoded data."); }
  }
  if (mode === "base64-encode") return success(res, { mode, result: Buffer.from(input.value, "utf8").toString("base64") });
  if (mode === "base64-decode") {
    try {
      const decoded = Buffer.from(input.value, "base64").toString("utf8");
      return success(res, { mode, result: decoded });
    } catch { return fail(res, 400, "INVALID_ENCODING", "Could not decode the Base64 text."); }
  }
  return fail(res, 400, "INVALID_MODE", "mode must be url-encode, url-decode, base64-encode, or base64-decode.");
});

app.post("/v1/text/lorem", (req, res) => {
  const count = req.body.count === undefined ? 1 : Number(req.body.count);
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    return fail(res, 400, "INVALID_COUNT", "count must be a whole number from 1 to 10.");
  }
  const sentence = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return success(res, { paragraphs: Array.from({ length: count }, (_, i) => sentence + (i % 2 ? " Ut enim ad minim veniam." : "")) });
});

// Developer tools
app.post("/v1/dev/json/format", (req, res) => {
  const input = getText(req, "json");
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  try { return success(res, { result: JSON.stringify(JSON.parse(input.value), null, 2) }); }
  catch { return fail(res, 400, "INVALID_JSON", "The supplied text is not valid JSON."); }
});

app.post("/v1/dev/json/validate", (req, res) => {
  const input = getText(req, "json");
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  try { JSON.parse(input.value); return success(res, { valid: true }); }
  catch (error) { return success(res, { valid: false, message: "The supplied text is not valid JSON." }); }
});

app.post("/v1/dev/hash", (req, res) => {
  const input = getText(req);
  if (input.error) return fail(res, 400, "INVALID_INPUT", input.error);
  const algorithm = req.body.algorithm || "sha256";
  if (!["sha256", "sha384", "sha512"].includes(algorithm)) {
    return fail(res, 400, "INVALID_ALGORITHM", "algorithm must be sha256, sha384, or sha512.");
  }
  return success(res, { algorithm, hash: crypto.createHash(algorithm).update(input.value, "utf8").digest("hex") });
});

// Fun endpoints use a local starter collection to avoid third-party API dependencies.
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "A SQL query walks into a bar, walks up to two tables, and asks: can I join you?"
];
const facts = [
  "A day on Venus is longer than its year.",
  "Octopuses have three hearts.",
  "The first computer bug was famously associated with an actual moth found in a computer."
];
const quotes = [
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" }
];
function pick(items) { return items[crypto.randomInt(0, items.length)]; }
app.get("/v1/fun/joke", (req, res) => success(res, { joke: pick(jokes) }));
app.get("/v1/fun/fact", (req, res) => success(res, { fact: pick(facts) }));
app.get("/v1/fun/quote", (req, res) => success(res, pick(quotes)));

// These features need an image upload pipeline or an AI provider; do not pretend they are active.
app.all("/v1/images/*", (req, res) => fail(res, 501, "FEATURE_NOT_READY", "Image endpoints are planned but not enabled yet."));
app.all("/v1/ai/*", (req, res) => fail(res, 501, "FEATURE_NOT_READY", "AI endpoints are planned but not enabled yet."));

app.use((req, res) => fail(res, 404, "NOT_FOUND", "This API endpoint does not exist."));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error && error.type === "entity.too.large") {
    return fail(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }
  console.error("LXWIS API error:", error && error.message ? error.message : "Unknown error");
  return fail(res, 500, "INTERNAL_ERROR", "Something went wrong while processing the request.");
});

module.exports = app;
