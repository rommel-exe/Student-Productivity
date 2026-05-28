import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Parser from "rss-parser";

dotenv.config();

// Pre-initialize parser
const rssParser = new Parser();

// Lazy load Gemini AI to avoid crashing if API key is not present on startup
let ai: GoogleGenAI | null = null;
function getAi() {
  if (!ai) {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }
  return ai;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for daily world briefing
  app.get("/api/briefing", async (req, res) => {
    try {
      const feed = await rssParser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
      
      const topNews = feed.items.slice(0, 3);
      // Remove any potentially hazardous content (like HTML tags) from description/snippet
      const sanitize = (str: string) => (str || '').replace(/<[^>]*>?/gm, '');
      const briefing = topNews.map(item => `• ${sanitize(item.title || 'News')}: ${sanitize(item.contentSnippet || item.description || '')}`).join(' ');
      
      res.json({ briefing: `Here is your top world news today: ${briefing}` });
    } catch (error: any) {
      console.error("Error generating briefing:", error);
      res.status(500).json({ error: "Failed to generate briefing" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
