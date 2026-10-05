// The API key lives in server.js (backend), not here.
const API_URL = "/api/chat";

const chat = document.getElementById("chat");
const form = document.getElementById("composer");
const input = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const modeBtns = document.querySelectorAll(".mode-btn");
const chips = document.querySelectorAll(".chip");
const newChatBtn = document.querySelector(".new-chat");
const subjectLinks = document.querySelectorAll(".subjects a");

let mode = "Explain";
let subject = "Maths";
let history = [];
let started = false;

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.textContent.trim();
  });
});

subjectLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    subjectLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    subject = link.textContent.trim();
    document.getElementById("sidebar").classList.remove("open");
  });
});

function systemPrompt() {
  const base =
    "You are Edu Genie, a friendly learning assistant for students. " +
    `The current subject is ${subject}. Use simple language and short paragraphs. `;
  if (mode === "Quiz me")
    return base + "Create a short quiz (3 to 5 questions) on the topic. Give the answers at the end.";
  if (mode === "Summarise")
    return base + "Summarise the topic in 5 short bullet points.";
  return base + "Explain the topic clearly with a simple example.";
}

function escapeHTML(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatText(text) {
  return escapeHTML(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function addUserMessage(text) {
  const el = document.createElement("article");
  el.className = "msg user";
  el.innerHTML = `<p>${escapeHTML(text)}</p>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function addGenieMessage(text) {
  const el = document.createElement("article");
  el.className = "msg genie";
  el.innerHTML =
    `<span class="avatar" aria-hidden="true">🪔</span>` +
    `<div class="bubble"><p>${formatText(text)}</p></div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function clearSampleContent() {
  if (started) return;
  chat.innerHTML = "";
  started = true;
}

async function askGemini(question) {
  history.push({ role: "user", parts: [{ text: question }] });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt(),
      contents: history,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    history.pop();
    throw new Error(data?.error || "Something went wrong.");
  }

  const reply = data.reply || "Sorry, I couldn't answer that. Try again.";

  history.push({ role: "model", parts: [{ text: reply }] });
  return reply;
}

async function handleSend(text) {
  const question = text.trim();
  if (!question) return;

  clearSampleContent();
  addUserMessage(question);
  input.value = "";
  sendBtn.disabled = true;

  const thinking = addGenieMessage("Thinking…");

  try {
    const reply = await askGemini(question);
    thinking.remove();
    addGenieMessage(reply);
  } catch (err) {
    thinking.remove();
    addGenieMessage("Error: " + err.message);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSend(input.value);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => handleSend(chip.textContent));
});

newChatBtn.addEventListener("click", () => {
  history = [];
  chat.innerHTML = "";
  started = true;
  addGenieMessage("Hi! I'm Edu Genie. What do you want to learn today?");
  input.focus();
});