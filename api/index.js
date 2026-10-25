const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function send(res, status, data) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  return res.status(status).json(data);
}

function getInput(req) {
  if (req.method === "GET") return { ...req.query };
  if (req.body && typeof req.body === "object") return req.body.input || req.body;
  return {};
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || data.error || `Upstream service returned ${response.status}`);
  return data;
}

module.exports = async (req, res) => {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!["GET", "POST"].includes(req.method)) return send(res, 405, { error: "Use GET or POST." });

  const input = getInput(req);
  const tool = String(req.query.tool || input.tool || "").trim().toLowerCase();
  const required = (key) => {
    const value = input[key];
    if (value === undefined || value === null || String(value).trim() === "") throw Object.assign(new Error(key + " is required."), { status: 400 });
    return String(value).trim();
  };

  try {
    let result;
    switch (tool) {
      case "whois": {
        const domain = required("domain").toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw Object.assign(new Error("Enter a valid domain."), { status: 400 });
        const boot = await jsonFetch("https://data.iana.org/rdap/dns.json");
        const service = boot.services.find(s => s[0].includes(domain.split(".").pop()));
        if (!service) throw Object.assign(new Error("No RDAP service found for this domain extension."), { status: 404 });
        const response = await fetch(service[1][0].replace(/\/$/, "") + "/domain/" + encodeURIComponent(domain));
        if (!response.ok) throw Object.assign(new Error("Domain record not found."), { status: 404 });
        result = await response.json(); break;
      }
      case "photo_search": {
        const query = required("query");
        if (!process.env.PIXABAY_API_KEY) throw Object.assign(new Error("Set PIXABAY_API_KEY in Vercel Environment Variables."), { status: 503 });
        result = await jsonFetch("https://pixabay.com/api/?key=" + encodeURIComponent(process.env.PIXABAY_API_KEY) + "&per_page=10&q=" + encodeURIComponent(query)); break;
      }
      case "qr":
        result = { url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(required("data")) }; break;
      case "tts":
        result = { url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=" + encodeURIComponent(input.lang || "en") + "&client=tw-ob&q=" + encodeURIComponent(required("text")) }; break;
      case "temp_mail_gen":
        result = await jsonFetch("https://api.guerrillamail.com/ajax.php?f=get_email_address&ip=127.0.0.1&agent=API"); break;
      case "temp_mail_check":
        result = await jsonFetch("https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=" + encodeURIComponent(required("token")) + "&ip=127.0.0.1&agent=API"); break;
      case "shorten": {
        const url = required("url");
        if (!/^https?:\/\//i.test(url)) throw Object.assign(new Error("URL must start with http:// or https://."), { status: 400 });
        const response = await fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(url));
        result = await response.text();
        if (!response.ok) throw new Error("URL shortener service failed."); break;
      }
      case "bin": {
        const bin = required("bin").replace(/\D/g, "").slice(0, 8);
        if (bin.length < 6) throw Object.assign(new Error("Enter at least 6 digits."), { status: 400 });
        result = await jsonFetch("https://lookup.binlist.net/" + bin, { headers: { "Accept-Version": "3", "User-Agent": "lxwis.site API" } }); break;
      }
      case "crypto": {
        const coin = String(input.coin || "bitcoin").toLowerCase();
        const data = await jsonFetch("https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(coin) + "&vs_currencies=usd&include_24hr_change=true");
        result = data[coin] || null; break;
      }
      case "randomuser": {
        const nat = input.nat ? "&nat=" + encodeURIComponent(input.nat) : "";
        const data = await jsonFetch("https://randomuser.me/api/?" + nat.slice(1));
        result = data.results?.[0] || data; break;
      }
      case "webstatus": {
        let url = required("url");
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw Object.assign(new Error("Only HTTP and HTTPS URLs are allowed."), { status: 400 });
        const started = Date.now();
        const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
        result = { url, status: response.status, ok: response.ok, ms: Date.now() - started }; break;
      }
      case "ai_chat": {
        if (req.method !== "POST") throw Object.assign(new Error("Use POST with JSON body { \"prompt\": \"...\" }."), { status: 405 });
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw Object.assign(new Error("Set GEMINI_API_KEY in Vercel Environment Variables."), { status: 503 });
        const prompt = required("prompt");
        const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
        let data;
        let lastError;
        for (const model of ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]) {
          try {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(key), {
              method: "POST", headers: { "Content-Type": "application/json" }, body
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              const message = payload.error?.message || "Gemini returned HTTP " + response.status;
              if ([429, 500, 502, 503, 504].includes(response.status)) {
                lastError = new Error(message);
                continue;
              }
              throw Object.assign(new Error(message), { status: response.status });
            }
            data = payload;
            break;
          } catch (error) {
            if (error.status) throw error;
            lastError = error;
          }
        }
        if (!data) throw Object.assign(new Error("Gemini models are temporarily busy or unavailable. Please retry in a minute. " + (lastError?.message || "")), { status: 503 });
        result = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || data; break;
      }
      case "vision": {
        if (req.method !== "POST") throw Object.assign(new Error("Use POST with JSON body containing image as base64 or a data URL."), { status: 405 });
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw Object.assign(new Error("Set GEMINI_API_KEY in Vercel Environment Variables."), { status: 503 });
        let image = required("image");
        let mime = "image/jpeg";
        const match = image.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/i);
        if (match) { mime = match[1].replace("jpg", "jpeg"); image = image.slice(match[0].length); }
        if (image.length > 6_000_000) throw Object.assign(new Error("Image is too large; keep the base64 data under 6 MB."), { status: 413 });
        const data = await jsonFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + encodeURIComponent(key), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: input.prompt || "Analyze this image and extract visible text." }, { inline_data: { mime_type: mime, data: image } }] }] })
        });
        result = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || data; break;
      }
      case "imgbb": {
        if (req.method !== "POST") throw Object.assign(new Error("Use POST with JSON body containing image as base64 or data URL."), { status: 405 });
        const key = process.env.FREEIMAGE_API_KEY;
        if (!key) throw Object.assign(new Error("Set FREEIMAGE_API_KEY in Vercel Environment Variables."), { status: 503 });
        const image = required("image").replace(/^data:image\/(?:png|jpeg|jpg|webp);base64,/i, "");
        const form = new URLSearchParams({ source: image });
        result = await jsonFetch("https://freeimage.host/api/1/upload?key=" + encodeURIComponent(key), { method: "POST", body: form }); break;
      }
      case "pastebin": {
        if (req.method !== "POST") throw Object.assign(new Error("Use POST with JSON body { \"text\": \"...\" }."), { status: 405 });
        const key = process.env.PASTEBIN_API_KEY;
        if (!key) throw Object.assign(new Error("Set PASTEBIN_API_KEY in Vercel Environment Variables."), { status: 503 });
        const form = new URLSearchParams({ api_dev_key: key, api_option: "paste", api_paste_code: required("text"), api_paste_private: "0", api_paste_name: input.title || "lxwis API Paste" });
        const response = await fetch("https://pastebin.com/api/api_post.php", { method: "POST", body: form });
        result = await response.text();
        if (!response.ok || result.startsWith("Bad API")) throw new Error("Pastebin rejected the request: " + result); break;
      }
      case "telegraph": {
        if (req.method !== "POST") throw Object.assign(new Error("Use POST with JSON body { \"title\": \"...\", \"content\": \"...\" }."), { status: 405 });
        const title = input.title || "Untitled";
        const content = required("content");
        const account = await jsonFetch("https://api.telegra.ph/createAccount?short_name=LXWISAPI&author_name=LXWIS");
        const nodes = content.split("\n").map(line => ({ tag: "p", children: [line || " "] }));
        result = await jsonFetch("https://api.telegra.ph/createPage", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ access_token: account.result.access_token, title, content: JSON.stringify(nodes), return_content: "false" }) });
        break;
      }
      default:
        return send(res, 400, { error: "Unknown tool. See /api-docs for supported tools.", tools: ["ai_chat","vision","whois","photo_search","qr","tts","temp_mail_gen","temp_mail_check","shorten","bin","crypto","randomuser","webstatus","imgbb","pastebin","telegraph"] });
    }
    return send(res, 200, { success: true, tool, result });
  } catch (error) {
    return send(res, error.status || 502, { success: false, error: error.message || "API request failed." });
  }
};
