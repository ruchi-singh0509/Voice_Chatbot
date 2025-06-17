# Voice Chatbot

A voice-enabled chatbot that uses ChatGPT's API to respond to user queries. The application features both voice and text input options, with voice output for responses.

## Project Structure

```
voice-chatbot/
├── client/             # React frontend
│   ├── public/        # Static files
│   └── src/           # React source code
└── server/            # Express backend
    └── server.js      # Server implementation
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd voice-chatbot
```

2. Set up the server:
```bash
cd server
npm install
```

3. Create a `.env` file in the server directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Set up the client:
```bash
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Features

- Voice input using the Web Speech API
- Text input option
- Voice output for responses
- Real-time chat interface
- Responsive design

## Browser Compatibility

The voice features require a modern browser that supports the Web Speech API. The application works best in:
- Google Chrome
- Microsoft Edge
- Firefox
- Safari

## Notes

- The server runs on port 3003 by default
- The client runs on port 3000 by default
- Make sure both the server and client are running simultaneously
- Allow microphone access when prompted by your browser 