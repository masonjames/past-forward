import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateDecadeImage } from "./server/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "dist");

const app = express();

const jsonLimit = process.env.REQUEST_BODY_LIMIT ?? "15mb";
app.use(express.json({ limit: jsonLimit }));

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

app.post("/api/generate", async (req, res) => {
  const { imageDataUrl, prompt } = req.body ?? {};

  if (typeof imageDataUrl !== "string" || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ error: "Both imageDataUrl and prompt must be provided as strings." });
  }

  try {
    const generatedImage = await generateDecadeImage(imageDataUrl, prompt);
    return res.status(200).json({ imageDataUrl: generatedImage });
  } catch (error) {
    console.error("Image generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  console.warn("dist directory not found. Did you run 'npm run build'?\n", distDir);
}

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  console.log(`Past Forward server listening on port ${port}`);
});
