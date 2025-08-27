export async function handler(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "OPTIONS, POST"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Use POST" };

  const auth = event.headers.authorization || event.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  // Read passes from env; accept JSON array of strings or [{code,tier}]
  const raw = process.env.MEMBER_PASSES || "";
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { parsed = (raw || "").split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); }

  let passes = [];
  if (Array.isArray(parsed)) {
    if (parsed.length && typeof parsed[0] === "string") {
      passes = parsed.map(code => ({ code, tier: "starter" }));
    } else {
      passes = parsed.map(p => ({ code: p.code || p.pass || p.id, tier: p.tier || "starter" })).filter(p => p.code);
    }
  }

  const found = passes.find(p => p.code === token);

  // Early auth handling
  if (!token) return { statusCode: 401, headers: cors, body: "Missing Member Pass (Authorization: Bearer <pass>)" };
  if (!found) return { statusCode: 402, headers: cors, body: "Invalid or inactive pass" };

  // Parse question
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}
  const q = body.q || body.question || body.message || "";
  if (!q) return { statusCode: 400, headers: cors, body: "Missing question" };

  // Call OpenAI
  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) return { statusCode: 500, headers: cors, body: "Server missing OPENAI_API_KEY" };

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise color assistant for hair colorists and creators. Give practical, safe, step-by-step guidance." },
          { role: "user", content: q }
        ],
        temperature: 0.4
      })
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "No reply.";
    return { statusCode: 200, headers: { ...cors, "Content-Type": "text/plain" }, body: text };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: "Upstream error." };
  }
}
