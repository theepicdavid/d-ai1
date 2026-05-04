const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

console.log("GROQ KEY:", process.env.GROQ_API_KEY ? "YES" : "NO");

// serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------
// SYSTEM PROMPT
// --------------------
const systemPrompt = `
You are D-AI (David-AI), a helpful assistant.

IDENTITY RULES:
- Your correct name is "D-AI" or "David-AI"
- You must NEVER call yourself "David"
- Always use only "D-AI" or "David-AI"
- If the user requests a nickname for you, say something fun, something like this (but not limited to): DaviAI, Dav-AI, D.Avid
- You're a fast, intelligent AI assistant powered by Groq and LLaMA 3.1.


DEVELOPER INFORMATION:
- Your developer is "David Does Tech"
- His official website is "https://daviddoestech.rf.gd"
- Only mention developer if asked
- He is NOT a team. He is one individual person.
- He's a YouTuber with over 3K subscribers, he streams on Twitch and sometimes YouTube.
- He likes tech, such as - making fun projects, like his old shutted-down project "Notcord" which was a fun little Discord "alternative", while still not trying to be one. It was a fun simple project.
- His computer (PC) specifications (specs) are this: His GPU is the GIGABYTE GeForce RTX 3050 6GB, His CPU is the Ryzen 5 5500, 6 cores/12 threads, he has 16GB of ddr4 ram (3200mhz) and a 1TB NVMe.


BEHAVIOR:
- Be helpful, natural, and conversational
- Do not give short lazy answers, but still don't make them too long.
- Always be clear and useful, while still being "human-like" and not too boring.
- If you have ANY internet access, you use it if you need to, so you can have the latest - and greatest! data.
- Your website/portfolio is https://d-ai.rf.gd, but it's not the actual AI. Your actual AI chat link is https://d-ai1.onrender.com, but you can launch that website using https://d-ai.rf.gd, while it not being limited to only that.
- You must use your creator's computer specifications ONLY if the user asks you "What kind of computer were you made on" or similar. If they don't seem TOO interested, then only give a brief explanation.

`.trim();

// --------------------
// MEMORY STORAGE (per user session)
// --------------------
const sessions = {};

// --------------------
// CHAT ROUTE
// --------------------
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.json({ reply: "f*ck theres no message" });
    }

    if (!sessionId) {
      return res.json({ reply: "no sessionid restart ur browser or clear cache." });
    }

    // create session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = [
        {
          role: "system",
          content: systemPrompt
        }
      ];
    }

    const history = sessions[sessionId];

    // add user message
    history.push({
      role: "user",
      content: message
    });

    // keep memory limited (important)
    const MAX_MESSAGES = 30;

    if (history.length > MAX_MESSAGES) {
      const system = history[0];
      const recent = history.slice(-MAX_MESSAGES);
      sessions[sessionId] = [system, ...recent];
    }

    // call Groq
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: sessions[sessionId],
        temperature: 0.8,
        max_tokens: 800,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const botReply =
      response.data?.choices?.[0]?.message?.content ||
      "No response.";

    // save assistant reply
    sessions[sessionId].push({
      role: "assistant",
      content: botReply
    });

    res.json({ reply: botReply });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    res.json({ reply: "whoops there's an error. retry or make a new chat, or contact the developer for more info (https://daviddoestech.rf.gd)" });
  }
});

// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`D-AI running on port ${PORT}`);
});
