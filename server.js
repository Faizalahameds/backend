const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SpeechClient } = require('@google-cloud/speech');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS options
const corsOptions = {
    origin: ["https://faizalahameds.github.io", "http://localhost:3000"], // Replace with your GitHub Pages URL
    methods: "GET,POST",
    allowedHeaders: ["Content-Type"]
};

// Middleware
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for large payloads

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// Decode the base64-encoded credentials for Google Speech-to-Text
let credentials;
try {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf8'));
} catch (error) {
    console.error("Error decoding Google credentials:", error);
    process.exit(1); // Exit if credentials can't be decoded
}

// Initialize the SpeechClient with decoded credentials
const client = new SpeechClient({ credentials });

// Helper function to format response text
function formatResponse(text) {
    return text
        .replace(/\*\*|\*/g, "")
        .replace(/`{3,}/g, "")
        .replace(/```python/g, "")
        .replace(/#+\s/g, "")
        .replace(/\n{2,}/g, "\n\n")
        .replace(/\n/g, "\n\n");
}

// Endpoint for Gemini AI response generation
app.post("/api/gemini", async (req, res) => {
    const { query } = req.body;

    try {
        const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(query);
        const formattedResponse = formatResponse(result.response.text());
        res.json({ answer: formattedResponse });
    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        res.status(500).json({ error: "Failed to fetch response from Gemini API" });
    }
});

// Endpoint for audio transcription and sending transcript to Gemini
app.post("/transcribe", async (req, res) => {
    const audioBytes = req.body.audio; // Expecting base64 audio data

    try {
        // Perform transcription using Google Speech-to-Text
        const [response] = await client.recognize({
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
            },
            audio: {
                content: audioBytes,
            },
        });

        // Check if transcription is available
        if (response.results && response.results.length > 0) {
            const transcriptText = response.results[0].alternatives[0].transcript;

            // Send the transcript to the Gemini API for further response generation
            const geminiResponse = await fetch("http://localhost:5000/api/gemini", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: transcriptText }),
            });

            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                res.json({ transcript: transcriptText, geminiAnswer: geminiData.answer });
            } else {
                const geminiError = await geminiResponse.json();
                res.status(500).json({ error: "Error from Gemini API", geminiError: geminiError.error });
            }
        } else {
            res.json({ transcript: 'No transcription available' });
        }
    } catch (error) {
        console.error("Error with Google Speech-to-Text or Gemini API:", error);
        res.status(500).json({ error: "Transcription and response generation failed", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
