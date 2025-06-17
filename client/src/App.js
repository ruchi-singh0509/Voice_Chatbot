import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane } from 'react-icons/fa';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    // Setting up voice recognition 
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      // When someone speaks, this is what happens
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      // When they stop speaking
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // If something goes wrong with voice recognition
      recognitionRef.current.onerror = (event) => {
        console.error('Voice recognition had a hiccup:', event.error);
        setError('Looks like voice recognition isn\'t working right now. You can still type your message!');
        setIsListening(false);
      };
    } else {
      setError('Sorry, your browser doesn\'t support voice recognition. But you can still chat with me using text!');
    }

    // Setting up text-to-speech
    speechSynthesisRef.current = window.speechSynthesis;

    // Cleanup when component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // This keeps the chat window scrolled to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toggle voice recognition on/off
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition isn\'t available in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error('Had trouble starting voice recognition:', err);
        setError('Couldn\'t start voice recognition. You can still type your message!');
      }
    }
  };

  // This handles sending messages and getting responses
  const handleSendMessage = async (message = input) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add the user's message to the chat
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setInput('');

    try {
      // Send the message to backend
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong with the response');
      }

      const data = await response.json();

      // Add  response to the chat
      setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);

      // Speak the response out loud
      if (speechSynthesisRef.current) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        speechSynthesisRef.current.speak(utterance);
      }
    } catch (error) {
      console.error('Oops, something went wrong:', error);
      setError(error.message || 'Had trouble sending your message');
      setMessages(prev => [...prev, { text: 'Sorry, I ran into an issue. Can you try again?', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Voice Chatbot</h1>
      </header>

      <main className="main">
        <div className="chat-container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Type your message..."
              className="input"
              disabled={isLoading}
            />
            <button
              onClick={toggleListening}
              className={`button mic ${isListening ? 'listening' : ''}`}
              disabled={isLoading}
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button
              onClick={() => handleSendMessage()}
              className="button send"
              disabled={isLoading}
            >
              <FaPaperPlane />
            </button>
          </div>
          {isLoading && (
            <div className="loading-indicator">
              Thinking...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
