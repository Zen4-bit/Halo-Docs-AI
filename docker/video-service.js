import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateVideo, checkVertexAIHealth } from "../backend/vertexAIService.js";

dotenv.config();

const app = express();
const PORT = process.env.VIDEO_SERVICE_PORT || 5002;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", async (req, res) => {
  const health = await checkVertexAIHealth();
  res.json({
    service: "Video Generation Service",
    status: health.status,
    model: process.env.VERTEX_AI_VIDEO_MODEL || "veo-1.0-001",
    timestamp: new Date().toISOString(),
  });
});

// Generate video
app.post("/generate", async (req, res) => {
  try {
    const { prompt, duration = "10s", resolution = "720p", style = "realistic" } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const result = await generateVideo(prompt, duration, resolution, style);
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
  console.log(`✅ Video Generation Service running on port ${PORT}`);
});
