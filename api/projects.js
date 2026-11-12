function respond(res, status, data) {
  res.status(status)
    .setHeader("Content-Type", "application/json")
    .setHeader("Cache-Control", "no-store")
    .json(data);
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(url + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Supabase request failed (" + response.status + "): " + detail.slice(0, 300));
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const id = String(req.query.id || "");
      if (!/^[a-f0-9-]{20,50}$/i.test(id)) {
        return respond(res, 400, { error: "A valid project id is required." });
      }

      const rows = await supabaseRequest(
        "tribble_projects?select=id,title,sprites,blocks,updated_at&id=eq." + encodeURIComponent(id) + "&limit=1"
      );
      if (!rows || !rows.length) return respond(res, 404, { error: "Project not found." });

      const row = rows[0];
      return respond(res, 200, {
        id: row.id,
        title: row.title,
        sprites: row.sprites || [],
        blocks: row.blocks || null,
        updatedAt: row.updated_at
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      if (!/^[a-f0-9-]{20,50}$/i.test(String(body.id || ""))) {
        return respond(res, 400, { error: "Invalid project id." });
      }
      if (typeof body.title !== "string" || body.title.trim().length > 80) {
        return respond(res, 400, { error: "Project title must be 80 characters or fewer." });
      }

      const project = {
        id: body.id,
        title: body.title.trim(),
        sprites: Array.isArray(body.sprites) ? body.sprites.slice(0, 100) : [],
        blocks: body.blocks || null,
        updated_at: new Date().toISOString()
      };

      await supabaseRequest("tribble_projects?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(project)
      });
      return respond(res, 200, { ok: true, id: body.id });
    }

    res.setHeader("Allow", "GET, POST");
    return respond(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return respond(res, 500, { error: error.message || "Server error." });
  }
};
