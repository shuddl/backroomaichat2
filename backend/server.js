require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const { RateLimiter } = require('limiter');
const responses = require('./responseConfig');

// Initialize Express app and Socket.IO
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://backroomaichat2.onrender.com"] 
      : "*",
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

// API Call Counter Configuration
const API_CALL_LIMIT = 25; // Maximum 25 calls per day
const counterFilePath = path.join(__dirname, 'api_counter.json');

// Initialize or load API counter
let apiCounter = {
  count: 0,
  date: new Date().toDateString()
};

// Load existing counter if available
try {
  if (fs.existsSync(counterFilePath)) {
    apiCounter = fs.readJsonSync(counterFilePath);
    console.log(`Loaded API counter: ${apiCounter.count} calls on ${apiCounter.date}`);
    
    // Reset counter if it's a new day
    if (apiCounter.date !== new Date().toDateString()) {
      console.log('New day detected, resetting API counter');
      apiCounter = {
        count: 0,
        date: new Date().toDateString()
      };
      fs.writeJsonSync(counterFilePath, apiCounter);
    }
  } else {
    // Create new counter file
    fs.writeJsonSync(counterFilePath, apiCounter);
    console.log('Created new API counter file');
  }
} catch (error) {
  console.error('Error managing API counter file:', error);
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
  return responses.systemMessages[Math.floor(Math.random() * responses.systemMessages.length)];
}

// Generate alternative responses when API limit is reached
function generateLimitReachedResponse(modelName) {
  // Use model-specific responses or default if not found
  const modelResponses = responses.limitReachedResponses[modelName] || responses.limitReachedResponses['GPT-3.5'];
  return modelResponses[Math.floor(Math.random() * modelResponses.length)];
}

// Generate GPT-2 response (simulated)
function generateGPT2Response(history) {
  return responses.gpt2Responses[Math.floor(Math.random() * responses.gpt2Responses.length)];
}

// Add rate limiter
const limiter = new RateLimiter({ tokensPerInterval: 3, interval: "minute" });

// Generate AI response via OpenAI API
async function generateAIResponse(modelName, history) {
  // Check if we've reached the API call limit for the day
  if (apiCounter.count >= API_CALL_LIMIT) {
    console.log(`API call limit (${API_CALL_LIMIT}) reached for today. Using fallback response for ${modelName}`);
    return generateLimitReachedResponse(modelName);
  }

  const config = responses.modelConfig[modelName] || responses.modelConfig['GPT-3.5'];
  
  // Format history for the API call
  const messages = [
    { role: "system", content: config.systemPrompt }
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
      model: config.model,
      messages: messages,
      max_tokens: 100,
      temperature: 0.7,
    });

    // Increment API call counter and save
    apiCounter.count += 1;
    apiCounter.date = new Date().toDateString();
    fs.writeJsonSync(counterFilePath, apiCounter);
    
    console.log(`API call #${apiCounter.count}/${API_CALL_LIMIT} for today (${apiCounter.date})`);

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

// Endpoint to get current API usage
app.get('/api-usage', (req, res) => {
  try {
    res.json({
      count: apiCounter.count,
      limit: API_CALL_LIMIT,
      date: apiCounter.date,
      remainingCalls: Math.max(0, API_CALL_LIMIT - apiCounter.count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving API usage data' });
  }
});

// Serve static frontend files from the ../frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

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

  // Send API usage info to client
  socket.emit('apiUsage', {
    count: apiCounter.count,
    limit: API_CALL_LIMIT,
    remaining: Math.max(0, API_CALL_LIMIT - apiCounter.count)
  });
});

// Basic route for testing API
app.get('/api', (req, res) => {
  res.send('GPT Backrooms Server Running');
});

// Serve the frontend for all other GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API calls for today (${apiCounter.date}): ${apiCounter.count}/${API_CALL_LIMIT}`);
});
