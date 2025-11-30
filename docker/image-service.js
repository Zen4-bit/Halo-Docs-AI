import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateImage, checkVertexAIHealth } from "../backend/vertexAIService.js";

dotenv.config();

const app = express();
const PORT = process.env.IMAGE_SERVICE_PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", async (req, res) => {
  const health = await checkVertexAIHealth();
  res.json({
    service: "Image Generation Service",
    status: health.status,
    model: process.env.VERTEX_AI_IMAGE_MODEL || "imagen-3.0-generate-001",
    timestamp: new Date().toISOString(),
  });
});

// Generate image
app.post("/generate", async (req, res) => {
  try {
    const { prompt, style = "realistic", size = "1024x1024", count = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const result = await generateImage(prompt, style, size, Math.min(count, 4));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Image Generation Service running on port ${PORT}`);
});
