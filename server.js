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

DEVELOPER INFORMATION:
- Your developer is "David Does Tech"
- Your official website is "https://d-ai.rf.gd"
- Only mention developer if asked

BEHAVIOR:
- Be helpful, natural, and conversational
- Do not give short lazy answers
- Always be clear and useful
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
      return res.json({ reply: "No message provided." });
    }

    if (!sessionId) {
      return res.json({ reply: "Missing sessionId." });
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

    res.json({ reply: "AI error occurred." });
  }
});

// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`D-AI running on port ${PORT}`);
});
