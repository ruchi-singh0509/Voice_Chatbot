require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3003;

// Making sure we have the API key before starting
if (!process.env.OPENAI_API_KEY) {
  console.error('Hey, looks like we forgot to set up the OpenAI API key!');
  process.exit(1);
}

// Setting up OpenAI 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Don't want anyone to spam the API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requests per 15 minutes
});

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://voice-chatbot-zjlg.vercel.app',
      'http://localhost:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

// Root route to handle base URL
app.get('/', (req, res) => {
  res.json({ message: 'Voice Chatbot API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// customized answers for the questions
const customAnswers = [
  {
    keywords: ["life story", "about your life", "your story"],
    answer: "I'm a passionate developer who has always been fascinated by the intersection of technology and human interaction. My journey in tech has been driven by a desire to create meaningful solutions that make a real impact. I've worked on various projects that combine AI with practical applications, always focusing on user-centric design and innovation."
  },
  {
    keywords: ["superpower", "#1 superpower", "your superpower"],
    answer: "My #1 superpower is my ability to rapidly learn and adapt to new technologies while maintaining a strong focus on practical implementation. I can quickly grasp complex concepts and translate them into working solutions, which has been crucial in my work with AI and voice technologies."
  },
  {
    keywords: ["areas you'd like to grow", "areas to grow", "grow in", "improve"],
    answer: "The top 3 areas I'm focusing on growing in are: Advanced AI/ML implementation and optimization; Leadership and team management skills; Strategic product development and scaling."
  },
  {
    keywords: ["misconception", "misconceptions", "coworkers have about you"],
    answer: "A common misconception my coworkers have about me is that I'm purely technical. While I do have strong technical skills, I'm equally passionate about understanding user needs and creating solutions that solve real problems. I believe in the importance of balancing technical excellence with practical business value."
  },
  {
    keywords: ["push your boundaries", "push boundaries", "limits", "step out of comfort zone"],
    answer: "I push my boundaries by constantly taking on challenging projects that force me to learn new skills. I actively seek out opportunities to work on cutting-edge technologies and complex problems. I believe in setting ambitious goals and working systematically to achieve them, even if it means stepping out of my comfort zone."
  }
];

// This function helps match questions to the customized answers
function getCustomAnswer(question) {
  const lowerQ = question.toLowerCase();
  for (const item of customAnswers) {
    if (item.keywords.some(keyword => lowerQ.includes(keyword))) {
      return item.answer;
    }
  }
  return null;
}

// Making sure we get valid messages
const validateMessage = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Oops! Please send a valid message.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'That message is a bit too long for me to handle!' });
  }
  next();
};

app.post('/api/chat', validateMessage, async (req, res) => {
  try {
    const { message } = req.body;

    // First, check if it has a prepared answer for this
    const customAnswer = getCustomAnswer(message);
    if (customAnswer) {
      return res.json({ response: customAnswer });
    }

    // If it doesn't have a prepared answer, let's generate one
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant. Keep responses professional but personal, and maintain a natural conversation flow."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Oops, something went wrong:', error);
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Looks like there might be an issue with the API key' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Slow down! Too many requests at once' });
    } else {
      res.status(500).json({ error: 'Something unexpected happened, but I\'m working on fixing it!' });
    }
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found - The requested endpoint does not exist' });
});

// Starting up the server
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}!`);
}); 