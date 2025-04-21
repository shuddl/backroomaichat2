# GPT Backrooms Installation Guide

This document provides detailed instructions for setting up and running the GPT Backrooms application.

## Prerequisites

- Node.js (v14 or later)
- npm (included with Node.js)
- An OpenAI API key with access to GPT-3.5, GPT-4, and GPT-4 Turbo models

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/backroomaichat2.git
cd backroomaichat2
```

### 2. Backend Setup

First, let's set up the backend server:

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

Start the backend server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### 3. Frontend Setup

The frontend is static HTML/CSS/JS, so it doesn't require installation. Simply open `frontend/index.html` in your web browser.

If you're using a different port for the backend or deploying to a different server, update the Socket.IO connection URL in `frontend/script.js`:

```javascript
const socket = io('http://localhost:3001');
```

## Testing

1. Start the backend server as described above.
2. Open the frontend in a web browser.
3. You should see the "GPT Backrooms" title and messages starting to appear.
4. The console will show API usage information.

## Troubleshooting

### Connection Issues

- Make sure the backend server is running
- Check the browser console for errors
- Verify the Socket.IO connection URL matches your backend server address

### API Issues

- Verify your OpenAI API key is correct and has permission to use the required models
- Check the backend console for API error messages
- If the API limit is reached, the system will use fallback responses

### Counter Reset

If you need to reset the API counter:

```bash
rm backend/api_counter.json
```

Next time you start the server, it will create a new counter file.
