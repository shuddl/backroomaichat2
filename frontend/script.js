// Connect to backend server with reconnection options
const socket = io('http://localhost:3001', {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

// DOM elements
const messageFeed = document.getElementById('message-feed');

// Format source string to CSS class name
function formatSourceToClass(source) {
    return source.toLowerCase().replace(/\s+/g, '-');
}

// Create a message element
function createMessageElement(message) {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box');
    messageBox.classList.add(formatSourceToClass(message.source));
    
    const speakerName = document.createElement('span');
    speakerName.classList.add('speaker-name');
    speakerName.textContent = message.source;
    
    const messageText = document.createElement('div');
    messageText.classList.add('message-text');
    messageText.textContent = message.text;
    
    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.textContent = message.timestamp;
    
    messageBox.appendChild(speakerName);
    messageBox.appendChild(messageText);
    messageBox.appendChild(timestamp);
    
    return messageBox;
}

// Append a message to the feed
function appendMessage(messageElement) {
    messageFeed.appendChild(messageElement);
    messageFeed.scrollTop = messageFeed.scrollHeight;
}

// Handle initial history on connection
socket.on('initialHistory', (history) => {
    // Clear any existing messages
    messageFeed.innerHTML = '';
    
    // Add all messages from history
    history.forEach(message => {
        const messageElement = createMessageElement(message);
        messageFeed.appendChild(messageElement);
    });
    
    // Scroll to bottom once all messages are added
    messageFeed.scrollTop = messageFeed.scrollHeight;
});

// Handle new messages
socket.on('newMessage', (message) => {
    const messageElement = createMessageElement(message);
    appendMessage(messageElement);
});

// Handle API usage information
socket.on('apiUsage', (usage) => {
    console.log(`API Usage: ${usage.count}/${usage.limit} calls used today (${usage.remaining} remaining)`);
    
    // Add API limit info to the page title if limit is approaching
    if (usage.remaining < 5) {
        document.title = `GPT Backrooms (${usage.remaining} API calls left)`;
    }
    
    // Add a system message if we're close to the limit
    if (usage.remaining === 3) {
        const warningMessage = {
            source: 'System Log',
            text: 'Warning: API call limit approaching. Communication may become limited soon.',
            timestamp: 'SYSTEM'
        };
        const messageElement = createMessageElement(warningMessage);
        appendMessage(messageElement);
    }
    
    if (usage.remaining === 0) {
        const limitMessage = {
            source: 'System Log',
            text: 'Notice: Daily API call limit reached. Models will use fallback responses until tomorrow.',
            timestamp: 'SYSTEM'
        };
        const messageElement = createMessageElement(limitMessage);
        appendMessage(messageElement);
    }
});

// Handle connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    
    // Add error message to feed
    const errorMessage = {
        source: 'System Log',
        text: 'Connection error. Please check if the server is running.',
        timestamp: 'ERROR'
    };
    
    const messageElement = createMessageElement(errorMessage);
    appendMessage(messageElement);
});

// Add reconnection events
socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    const reconnectMessage = {
        source: 'System Log',
        text: 'Connection reestablished to backrooms server.',
        timestamp: 'SYSTEM'
    };
    const messageElement = createMessageElement(reconnectMessage);
    appendMessage(messageElement);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect');
    const failedMessage = {
        source: 'System Log',
        text: 'Connection to backrooms server permanently lost. Refresh the page to try again.',
        timestamp: 'ERROR'
    };
    const messageElement = createMessageElement(failedMessage);
    appendMessage(messageElement);
});

// Initial connection message
console.log('Connecting to GPT Backrooms server...');
