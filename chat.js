// Configuration
const API_CONFIG = {
  BACKEND_URL: 'http://localhost:5500/api/chat',
  SAVE_CHAT_URL: 'http://localhost:5500/api/save-chat',
  GET_CHAT_URL: 'http://localhost:5500/api/get-chats'
};

const user = JSON.parse(localStorage.getItem("user"));
let lastRequestTime = 0;
const TYPING_DELAY = 700;
const RATE_LIMIT_DELAY = 1000;

// DOM
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  saveChat("user", message);
  userInput.value = "";
  userInput.focus();

  const typingIndicator = showTypingIndicator();

  try {
    const reply = await getBotReply(message);
    chatBox.removeChild(typingIndicator);
    addMessage("bot", reply);
    saveChat("bot", reply);
  } catch (error) {
    chatBox.removeChild(typingIndicator);
    addMessage("bot", "Sorry, I encountered an error.");
    console.error("Chat Error:", error);
  }
}

async function getBotReply(msg) {
  const now = Date.now();
  if (now - lastRequestTime < RATE_LIMIT_DELAY) {
    return "Please wait a moment before sending another message.";
  }
  lastRequestTime = now;

  try {
    const response = await fetch(API_CONFIG.BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.reply || "No response from AI";
  } catch (error) {
    console.error('API Request Failed:', error);
    return "Our AI is currently unavailable. Please try again later.";
  }
}

function addMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot typing";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  typingDiv.appendChild(bubble);
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  return typingDiv;
}

async function saveChat(sender, message) {
  if (!user?.id) return;
  await fetch(API_CONFIG.SAVE_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, sender, message })
  });
}

async function loadChatHistory() {
  if (!user?.id) return;
  const res = await fetch(`${API_CONFIG.GET_CHAT_URL}/${user.id}`);
  const history = await res.json();
  history.forEach(msg => addMessage(msg.sender, msg.message));
}

document.addEventListener("DOMContentLoaded", () => {
  loadChatHistory();
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

document.getElementById("send-btn")?.addEventListener("click", sendMessage);
