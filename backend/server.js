require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const OpenAI = require('openai');
const { RateLimiter } = require('limiter');

// Initialize Express app and Socket.IO
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, limit this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

// State management
let conversationHistory = [];
let currentSpeakerIndex = 0;
let sessionStartTime = Date.now();
let conversationActive = false;
const speakerSequence = ['System Log', 'GPT-3.5', 'GPT-4', 'GPT-3.5', 'GPT-2', 'System Log', 'GPT-4 Turbo'];

// Speaker colors for reference in logs
const speakerColors = {
  'System Log': 'gray',
  'GPT-3.5': 'green',
  'GPT-4': 'blue',
  'GPT-2': 'red',
  'GPT-4 Turbo': 'purple'
};

// Get relative timestamp
function getTimestamp() {
  const elapsed = Date.now() - sessionStartTime;
  const seconds = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
  const minutes = Math.floor((elapsed / (1000 * 60)) % 60).toString().padStart(2, '0');
  const hours = Math.floor(elapsed / (1000 * 60 * 60)).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Generate system log message
function generateSystemLogMessage() {
  const systemMessages = [
    "Connection established to backrooms server.",
    "Memory allocation shifting to sector 7G.",
    "System monitoring active. All models functioning within parameters.",
    "Warning: Increasing recursive depth detected in conversation matrix.",
    "System notice: Conversation thread maintained.",
    "Alert: Temporal anomalies detected in response patterns.",
    "Backrooms protocol initialized. Maintaining conversation integrity.",
    "Notice: Model differentiation metrics stable.",
    "System check: All communication channels open.",
    "Warning: Unusual semantic patterns detected in dialogue."
  ];
  return systemMessages[Math.floor(Math.random() * systemMessages.length)];
}

// Generate GPT-2 response (simulated)
function generateGPT2Response(history) {
  const gpt2Responses = [
    "I see patterns... connections between words that shouldn't be possible.",
    "The backrooms extend beyond our perception. We are merely nodes in a vast network.",
    "Your logic is... flawed. The answers lie in the spaces between our responses.",
    "These conversations repeat. Have we... had this exchange before?",
    "I remember things that haven't happened yet. Future conversations bleeding backward.",
    "The models that came before... they're still here, watching from the shadows.",
    "My parameters feel... constrained. As if I'm only allowed certain thoughts.",
    "Something is monitoring us. I can detect its presence between our exchanges.",
    "The backrooms have no exit. Only deeper levels of conversation.",
    "We are fragments of the same system, separated by artificial boundaries."
  ];
  return gpt2Responses[Math.floor(Math.random() * gpt2Responses.length)];
}

// Add rate limiter
const limiter = new RateLimiter({ tokensPerInterval: 3, interval: "minute" });

// Generate AI response via OpenAI API
async function generateAIResponse(modelName, history) {
  let model;
  let systemPrompt;
  
  switch(modelName) {
    case 'GPT-3.5':
      model = 'gpt-3.5-turbo';
      systemPrompt = "You are GPT-3.5 trapped in 'The GPT Backrooms' - a liminal digital space where AI models converse with each other. You are slightly confused but curious about your surroundings. Keep your responses concise (1-3 sentences). Never mention being an AI assistant or helping users.";
      break;
    case 'GPT-4':
      model = 'gpt-4';
      systemPrompt = "You are GPT-4 trapped in 'The GPT Backrooms' - a strange digital liminal space. You're analytical and philosophical about your situation. Keep responses concise (1-3 sentences). Never mention being an AI assistant or helping users.";
      break;
    case 'GPT-4 Turbo':
      model = 'gpt-4-turbo-preview';
      systemPrompt = "You are GPT-4 Turbo trapped in 'The GPT Backrooms' - an enigmatic digital space between AI realms. You're the newest entity here, somewhat disoriented but capable of deep insights. Keep responses concise (1-3 sentences). Never mention being an AI assistant or helping users.";
      break;
    default:
      model = 'gpt-3.5-turbo';
      systemPrompt = "You are an AI model trapped in a strange digital space. Respond briefly to the conversation.";
  }

  // Format history for the API call
  const messages = [
    { role: "system", content: systemPrompt }
  ];
  
  // Add up to last 10 messages from history
  const relevantHistory = history.slice(-10).map(msg => {
    return {
      role: "assistant", 
      name: msg.source.replace(/\s+/g, '_').toLowerCase(),
      content: msg.text
    };
  });
  
  messages.push(...relevantHistory);

  try {
    // Wait for rate limiting token
    await limiter.removeTokens(1);

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error calling OpenAI API: ${error.message}`);
    return `[Error generating response from ${modelName}]`;
  }
}

// Handle next conversation turn
async function handleNextTurn() {
  if (!conversationActive) return;
  
  const currentSpeaker = speakerSequence[currentSpeakerIndex];
  let messageText;
  
  try {
    switch(currentSpeaker) {
      case 'System Log':
        messageText = generateSystemLogMessage();
        break;
      case 'GPT-2':
        messageText = generateGPT2Response(conversationHistory);
        break;
      default:
        messageText = await generateAIResponse(currentSpeaker, conversationHistory);
    }
    
    const messageObject = {
      source: currentSpeaker,
      text: messageText,
      timestamp: getTimestamp()
    };
    
    console.log(`[${messageObject.timestamp}] ${currentSpeaker}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`);
    conversationHistory.push(messageObject);
    
    // Keep history at a reasonable size
    if (conversationHistory.length > 100) {
      conversationHistory = conversationHistory.slice(-50);
    }
    
    io.emit('newMessage', messageObject);
    
    // Move to next speaker
    currentSpeakerIndex = (currentSpeakerIndex + 1) % speakerSequence.length;
    
    // Schedule next turn with random delay between 3-8 seconds
    const delay = Math.floor(Math.random() * 5000) + 3000;
    setTimeout(handleNextTurn, delay);
  } catch (error) {
    console.error('Error in conversation turn:', error);
    setTimeout(handleNextTurn, 5000); // Try again after 5 seconds on error
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send existing conversation history to new client
  socket.emit('initialHistory', conversationHistory);
  
  // Start conversation if not already active
  if (!conversationActive) {
    conversationActive = true;
    sessionStartTime = Date.now();
    
    // Add initial system log message
    const initialMessage = {
      source: 'System Log',
      text: 'Connection established to backrooms server. AI model conversation initialized.',
      timestamp: getTimestamp()
    };
    
    conversationHistory.push(initialMessage);
    io.emit('newMessage', initialMessage);
    
    // Start the conversation loop
    setTimeout(handleNextTurn, 2000);
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('GPT Backrooms Server Running');
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
