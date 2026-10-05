// Edu Genie backend. Run with: node server.js
// Needs Node.js 18 or newer. No npm install needed.

const http = require("http");
const fs = require("fs");
const path = require("path");
// ================== SETTINGS ==================
const GEMINI_API_KEY = "const GEMINI_API_KEY = process.env.GEMINI_API_KEY:" || "PASTE_YOUR_GEMINI_API_KEY_HERE"; // from aistudio.google.com
const MODEL = "gemini-3-flash-preview";                  // change if "model not found"
const PORT = 3000;
// ==============================================

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function sendJSON(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  // ---------- Backend API ----------
  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        if (GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
          return sendJSON(res, 500, { error: "Paste your Gemini API key in server.js first." });
        }

        const { system, contents } = JSON.parse(body);

        const r = await fetch(GEMINI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
          }),
        });

        const data = await r.json();
        if (!r.ok) {
          return sendJSON(res, r.status, { error: data?.error?.message || "Gemini error" });
        }

        const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
        console.log("Question answered ✔");
        sendJSON(res, 200, { reply });
      } catch (err) {
        console.error("Error:", err.message);
        sendJSON(res, 500, { error: err.message });
      }
    });
    return;
  }

  // ---------- Serve the frontend files ----------
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(__dirname, path.normalize(urlPath));

  // only allow the 3 frontend files
  const allowed = ["index.html", "style.css", "script.js"];
  if (!allowed.includes(path.basename(filePath)) || !filePath.startsWith(__dirname)) {
    res.writeHead(404);
    return res.end("Not found");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "text/plain" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Edu Genie running ✔  Open: http://localhost:${PORT}`);
});