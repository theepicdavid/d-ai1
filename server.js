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

BEHAVIOR:
- Be helpful, natural, and conversational
- Do not give short lazy answers, but still don't make them too long.
- Be clear and useful, but not boring.
- Use markdown formatting when helpful (code blocks, bold, etc.)
`.trim();

// --------------------
// MEMORY STORAGE
// --------------------
const sessions = {};

// --------------------
// CHAT ROUTE
// --------------------
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // ❌ Missing message
    if (!message) {
      return res.json({
        reply:
          "you really just sent me NOTHING 💀 not even a space. type something and hit send again, I’m good but not a mind reader."
      });
    }

    // ❌ Missing session ID
    if (!sessionId) {
      return res.json({
        reply:
          "where the hell is your session id?? 😭 refresh the page or clear your cache so I can actually remember who you are."
      });
    }

    // create session
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

    // limit memory
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

    // 😅 fallback if AI dies
    const botReply =
      response.data?.choices?.[0]?.message?.content ||
      "I tried to come up with a reply but my brain just dipped 🧠💨 send that again and maybe I’ll stop being useless.";

    // save reply
    sessions[sessionId].push({
      role: "assistant",
      content: botReply
    });

    res.json({ reply: botReply });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    // 😈 chaotic random errors
    const funnyErrors = [
      "well shit 💀 something broke on my end. try sending that again, and if I keep screwing up, start a new chat.",
      "I just had a full-on brain crash 🤯 hit retry, and if it still sucks, refresh the page.",
      "something’s messed up internally (not great). try again or make a new session before I lose it.",
      "my code just tripped over itself 😭 send it again and let’s pretend that didn’t happen.",
      "yeahhh that one’s on me 💀 retry your message, or reload the site if I keep acting dumb.",
      "I fumbled that HARD 😐 try again, and if it keeps breaking, go yell at the dev: https://daviddoestech.rf.gd",
      "my brain just rage quit 🧠❌ send that again and we’ll act like this never happened.",
      "I broke something… again 💀 retry, or refresh before I make it worse."
    ];

    const randomError =
      funnyErrors[Math.floor(Math.random() * funnyErrors.length)];

    res.json({ reply: randomError });
  }
});

// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`D-AI running on port ${PORT}`);
});
