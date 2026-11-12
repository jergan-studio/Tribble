const corsHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function respond(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json").setHeader("Cache-Control", "no-store").json(data);
}
async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Upstash is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  const response = await fetch(url.replace(/\/$/, "") + "/" + command.map(part => encodeURIComponent(String(part))).join("/"), {
    headers: { Authorization: "Bearer " + token }
  });
  if (!response.ok) throw new Error("Upstash request failed");
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}
module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const id = String(req.query.id || "");
      if (!/^[a-f0-9-]{20,50}$/i.test(id)) return respond(res, 400, { error: "A valid project id is required." });
      const value = await redis(["GET", "tribble:project:" + id]);
      if (!value) return respond(res, 404, { error: "Project not found." });
      return respond(res, 200, JSON.parse(value));
    }
    if (req.method === "POST") {
      const body = req.body || {};
      if (!/^[a-f0-9-]{20,50}$/i.test(String(body.id || ""))) return respond(res, 400, { error: "Invalid project id." });
      if (typeof body.title !== "string" || body.title.length > 80) return respond(res, 400, { error: "Project title must be 80 characters or fewer." });
      const payload = JSON.stringify({ id: body.id, title: body.title, sprites: Array.isArray(body.sprites) ? body.sprites.slice(0, 100) : [], blocks: body.blocks || null, updatedAt: new Date().toISOString() });
      await redis(["SET", "tribble:project:" + body.id, payload, "EX", "2592000"]);
      return respond(res, 200, { ok: true, id: body.id });
    }
    res.setHeader("Allow", "GET, POST");
    return respond(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return respond(res, 500, { error: error.message || "Server error." });
  }
};