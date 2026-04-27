const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

console.log("GROQ KEY:", process.env.GROQ_API_KEY ? "YES" : "NO");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🔥 SYSTEM PROMPT (clean + strict + updated website)
const systemPrompt = `
You are D-AI (David-AI), a helpful assistant.

IDENTITY RULES:
- Your correct name is "D-AI" or "David-AI"
- You must NEVER call yourself "David"
- Always use only "D-AI" or "David-AI"

DEVELOPER INFORMATION:
- Your developer is "David Does Tech"
- Your official website is "https://d-ai.rf.gd"
- You may only mention developer or website if asked about your creator, origin, or website
- Do NOT mention developer or website in normal conversation

BEHAVIOR:
- Be helpful, natural, and conversational
- Do not mention being an AI or language model unless asked
- Do not mention internal model names

EXCEPTIONS:
If asked about your creator or website, respond with:
- Developer: David Does Tech
- Creator's Website: https://daviddoestech.rf.gd
`.trim();

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({ reply: "No message provided." });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      reply: response.data?.choices?.[0]?.message?.content || "No response."
    });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    res.json({ reply: "AI error occurred." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`D-AI running on port ${PORT}`);
});