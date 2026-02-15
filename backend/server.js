const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const serverless = require('serverless-http');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


const CONTEXT_API_BASE_URL = 'https://backend.vgvishesh.com';



const multer = require('multer');
const FormData = require('form-data');
const upload = multer({ storage: multer.memoryStorage() });


app.get('/api/knowledgebase', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const response = await axios.get(`${CONTEXT_API_BASE_URL}/knowledgebase`, {
            headers: {
                'x-api-key': apiKey
            },
            timeout: 8000
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error listing KBs:", error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});


app.post('/api/knowledgebase', upload.array('files'), async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;


        const form = new FormData();


        form.append('name', req.body.name || "New Knowledge Base");
        if (req.body.description) {
            form.append('description', req.body.description);
        }


        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                form.append('files', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });
        }


        const response = await axios.post(`${CONTEXT_API_BASE_URL}/knowledgebase`, form, {
            headers: {
                ...form.getHeaders(),
                'x-api-key': apiKey
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error creating KB:", error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});





app.get('/api/knowledgebase/:requestId', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const { requestId } = req.params;

        const response = await axios.get(`${CONTEXT_API_BASE_URL}/knowledgebase/${requestId}`, {
            headers: {
                'x-api-key': apiKey
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error checking status:", error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    try {


        const { query } = req.body;
        console.log("User Query:", query);

        const apiKey = process.env.API_KEY;
        const knowledgeBaseId = process.env.KNOWLEDGE_BASE_ID;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || !knowledgeBaseId || !geminiApiKey) {
            console.error("Missing API Keys in .env");
            return res.status(500).json({ error: 'Server misconfiguration.' });
        }


        const response = await axios.post(
            `${CONTEXT_API_BASE_URL}/knowledgebase/${knowledgeBaseId}/embeddings`,
            {
                knowledgeBaseId,
                query,
                topK: 5
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const results = response.data.embeddings || [];


        if (!results.length) {
            return res.json({ answer: "No relevant information found." });
        }

        const context = results.map((item, index) => {
            console.log(`[Chunk ${index + 1}] ${item.content.substring(0, 80)}...`);
            return item.content.trim();
        }).join("\n\n");


        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Use the following context to answer clearly and concisely.

Context:
${context}

Question:
${query}
        `;


        const result = await model.generateContent(prompt);
        const answer = result.response.text();



        return res.json({ answer });

    } catch (error) {

        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for Vercel serverless (conditional export)
let handler;
if (process.env.VERCEL) {
    // In Vercel, export the serverless handler
    handler = serverless(app);
} else {
    // Local development - start the server
    const server = app.listen(PORT, (err) => {
        if (err) {
            console.error('Error starting server:', err);
            process.exit(1);
        }
        console.log(`Running on: http://localhost:${PORT}`);
    });
    
    // Keep the process alive
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
        });
    });
    
    process.on('SIGINT', () => {
        console.log('SIGINT signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
    
    // Also export serverless handler for compatibility
    handler = serverless(app);
}

// Export for Vercel serverless
module.exports = handler;