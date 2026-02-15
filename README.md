# AI Knowledge Base Chatbot

A full-stack chatbot that lets you chat with your documents. Upload your files, and the bot will search through them to answer your questions using Google's Gemini AI.

## What Does It Do?

Think of this as your personal document assistant. You upload PDFs, text files, or other documents into a knowledge base, then ask questions about them in plain English. The system finds the relevant parts and uses AI to give you clear, contextual answers.

The app has two main parts:
- A React frontend where you interact with the chatbot
- A Node.js backend that handles file uploads, searches your documents, and talks to the AI

## Main Features

**On the backend:**
- Keeps your API keys secure (they never touch the browser)
- Handles file uploads through a simple API
- Searches documents using embeddings from the Context API
- Sends relevant context to Google Gemini to generate smart answers
- Works with multiple knowledge bases

**On the frontend:**
- Clean chat interface to ask questions and see answers
- Knowledge base manager to create new collections and upload files
- Real-time status updates while files are being processed
- Markdown support for nicely formatted responses

## Tech Stack

Here's what we're using under the hood.

**Frontend:**
- React 19.2.0 for the UI
- Vite 7.3.1 for fast development and building
- react-markdown to display formatted responses

**Backend:**
- Express 5.2.1 as the web server
- Google Generative AI SDK for Gemini integration
- Multer for handling file uploads
- Axios for making HTTP requests
- CORS enabled so the frontend can talk to the backend

## How It Works

The data flows like this:

1. You type a question in the frontend
2. Backend receives it and queries the Context API to find relevant document chunks
3. Those chunks get sent to Google Gemini along with your question
4. Gemini reads the context and generates an answer
5. The answer comes back through the backend and displays in the chat

Here's a simple diagram:

```
Frontend (React) ←→ Backend (Express) ←→ Context API (Documents)
                           ↓
                    Google Gemini AI
```

## Getting Started

### What You Need

- Node.js (version 16 or newer)
- npm (comes with Node.js)
- Two API keys:
  - A Context API key from backend.vgvishesh.com
  - A Google Gemini API key from Google AI Studio

### Installation Steps

First, clone the repo and navigate into it:

```bash
git clone <repository-url>
cd ai-knowledge-base-chatbot
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### Setting Up Environment Variables

Create a file called `.env` in the backend folder with these values:

```env
PORT=3000
API_KEY=your_context_api_key_here
KNOWLEDGE_BASE_ID=your_default_kb_id_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace the placeholder values with your actual API keys. The `KNOWLEDGE_BASE_ID` should be the ID of whichever knowledge base you want to query by default when chatting.

## Running the App

You need to run both the backend and frontend at the same time.

**Start the backend (Terminal 1):**

```bash
cd backend
npm start
```

Or alternatively:
```bash
cd backend
node server.js
```

It'll start on http://localhost:3000

**Start the frontend (Terminal 2):**

```bash
cd frontend
npm run dev
```

It'll start on http://localhost:5173

Open your browser to http://localhost:5173 and you're good to go.

**Note:** Make sure both servers are running in separate terminals. The frontend needs the backend to be running to make API calls.

## How to Use It

### Creating a Knowledge Base

1. Go to the Knowledge Base Manager section
2. Give it a name and optionally a description
3. Choose files to upload (you can select multiple)
4. Click create and wait for it to process

Once it's done, you'll get a knowledge base ID you can use for chatting.

### Chatting

Make sure your `.env` file has the right `KNOWLEDGE_BASE_ID` set. Then just type questions into the chat box and hit send. The bot will search your documents and respond with an answer.

## API Endpoints

If you want to integrate with this or test manually, here are the endpoints:

### GET /api/knowledgebase

Lists all your knowledge bases.

### POST /api/knowledgebase

Creates a new knowledge base. Send files as multipart/form-data with fields:
- `name` - required
- `description` - optional
- `files` - one or more files

Returns a `requestId` you can use to check the status.

### GET /api/knowledgebase/:requestId

Checks the status of a knowledge base that's being created. Once it's done, you'll get the `knowledgeBaseId`.

### POST /api/chat

Send a question to the chatbot. Body should be:

```json
{
  "query": "Your question here"
}
```

Returns:

```json
{
  "answer": "The AI's response"
}
```

## Project Layout

```
ai-knowledge-base-chatbot/
├── backend/
│   ├── server.js       # All the API routes and logic
│   ├── .env            # Your API keys (don't commit this)
│   ├── package.json
│   └── vercel.json     # Config for deploying to Vercel
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx     # Main React component
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Deploying to Production

### Backend (Vercel)

The backend is already set up for Vercel serverless functions. Deploy it:

```bash
npm install -g vercel
cd backend
vercel
```

**Important:** Add these environment variables in the Vercel dashboard:
- `API_KEY` - Your Context API key
- `KNOWLEDGE_BASE_ID` - Your default knowledge base ID
- `GEMINI_API_KEY` - Your Google Gemini API key

The backend will be available at `https://your-project.vercel.app/api/*`

### Frontend (Vercel)

1. **Set the API URL environment variable:**
   - In Vercel dashboard, go to your frontend project settings
   - Add environment variable: `VITE_API_URL` = `https://your-backend-project.vercel.app`
   - This tells the frontend where to find your backend API

2. **Deploy the frontend:**
   ```bash
   cd frontend
   npm run build
   vercel
   ```

   Or connect your GitHub repo to Vercel and it will auto-deploy.

**Alternative:** You can also deploy both as a monorepo by creating a root `vercel.json` that handles both frontend and backend routing.

## Troubleshooting

**Backend won't start?**
- Make sure you ran `npm install` in the backend folder
- Check that your `.env` file exists and has all the required keys
- Try a different port if 3000 is already in use (or set PORT in .env)

**Chat not working?**
- Verify your `KNOWLEDGE_BASE_ID` is correct
- Make sure the knowledge base finished processing (check the status endpoint)
- Look at the browser's network tab to see if requests are failing

**Getting "model not found" errors?**
- The Gemini model name in `server.js` might need updating. Check line 148 and make sure `gemini-2.5-flash` is available, or switch to another model like `gemini-1.5-flash`

**No results from the knowledge base?**
- Your question might not match the content well. Try rephrasing it
- Make sure your files actually uploaded successfully

## Contributing

Feel free to open issues or submit pull requests if you find bugs or want to add features.

## License

ISC License

---

Built with React, Express, and Google Gemini AI
