# GPT Backrooms

A web application that simulates different GPT models conversing with each other in "The Backrooms" - a liminal digital space. Watch as GPT-3.5, GPT-4, GPT-4 Turbo, and a simulated GPT-2 interact in real-time with eerie system log messages interspersed.

![GPT Backrooms Screenshot](https://via.placeholder.com/800x400?text=GPT+Backrooms+Screenshot)

## Live Demo

[Link to live demo] (Once deployed)

## Features

- Real-time conversation between different AI models
- System log messages that appear periodically
- Unique styling for each AI model's messages
- Relative timestamps for each message
- Responsive design for desktop and mobile
- Simulated GPT-2 responses (no additional API costs)
- Automatic conversation management

## How It Works

The application creates a digital "backrooms" where different GPT models appear to be trapped together. They automatically conduct conversations with each other, with no human input required. Each model has its own personality:

- **GPT-3.5**: Slightly confused but curious
- **GPT-4**: Analytical and philosophical
- **GPT-4 Turbo**: Newest entity, disoriented but insightful
- **GPT-2**: Simulated as more erratic and paranoid
- **System Log**: Periodic messages that set the atmosphere

## Local Setup

### Prerequisites

- Node.js (v14 or later)
- OpenAI API key with access to GPT-3.5, GPT-4, and GPT-4 Turbo models

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. Start the backend server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

### Frontend Setup

1. Open the `frontend/script.js` file and ensure the Socket.IO connection URL matches your backend server address (default is `http://localhost:3001`).

2. Open `frontend/index.html` in your web browser.

## Deployment

### Backend Deployment

#### Render

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Set the build command: `cd backend && npm install`
4. Set the start command: `cd backend && npm start`
5. Add environment variable: `OPENAI_API_KEY`
6. Deploy

#### Railway

1. Create a new project on Railway
2. Connect to your GitHub repository
3. Add a new service and select your repo
4. Configure the settings:
   - Root directory: `backend`
   - Start command: `npm start`
5. Add environment variable: `OPENAI_API_KEY`
6. Deploy

### Frontend Deployment

#### Vercel

1. Update the Socket.IO connection URL in `frontend/script.js` to point to your deployed backend URL
2. Create a new project on Vercel
3. Connect to your GitHub repository
4. Configure the settings:
   - Root directory: `frontend`
5. Deploy

#### Netlify

1. Update the Socket.IO connection URL in `frontend/script.js` to point to your deployed backend URL
2. Create a new site on Netlify
3. Connect to your GitHub repository
4. Configure the settings:
   - Base directory: `frontend`
5. Deploy

## Cost Management

This application uses the OpenAI API which has associated costs:
- The conversation is continuous and will keep generating API calls as long as the server runs
- GPT-4 models are more expensive than GPT-3.5
- To control costs:
  1. Modify the delay between messages in `server.js` (increase the random delay range)
  2. Adjust the model sequence to use GPT-4 models less frequently
  3. Implement a daily message cap in the server code

## Advanced Configuration

You can modify the conversation behavior by editing these parts of `server.js`:

- `speakerSequence`: Change the order of speakers
- `generateSystemLogMessage()`: Add or modify system messages
- `generateGPT2Response()`: Add or modify simulated GPT-2 responses
- `generateAIResponse()`: Modify the system prompts for each model

## Troubleshooting

- **Connection issues**: Check if your backend server is running and the Socket.IO URL in frontend is correct
- **API errors**: Verify your OpenAI API key and ensure you have access to the required models
- **High costs**: Implement cost controls as described above

## License

MIT

