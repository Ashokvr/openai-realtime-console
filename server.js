import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.text());
app.use(express.static(path.resolve(__dirname, "client/dist")));

const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

const sessionConfig = JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: {
        voice: "marin",
      },
    },
  },
});

// Token route
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: sessionConfig,
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// SDP session
app.post("/session", async (req, res) => {
  const fd = new FormData();
  fd.set("sdp", req.body);
  fd.set("session", sessionConfig);

  const r = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      "OpenAI-Beta": "realtime=v1",
      Authorization: `Bearer ${apiKey}`,
    },
    body: fd,
  });

  const sdp = await r.text();
  res.send(sdp);
});

// Fallback to React index.html
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client/dist/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
