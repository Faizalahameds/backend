// backend/server.js
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Replace with your actual API key
const API_KEY = "AIzaSyDafp_ZEl13nMCofkQE-vPr0x8BIo_98q0";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to format response text with extra spacing after paragraphs
// Helper function to format response text with extra spacing after paragraphs
function formatResponse(text) {
  // Split the text into paragraphs
  let paragraphs = text.split('\n\n').map(p => p.trim());

  // Format each paragraph
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (paragraph.startsWith('|')) {
      // Format tables (assuming tables are written with pipes)
      return `<pre>${paragraph}</pre>`; // Use <pre> to preserve whitespace in tables
    } else if (paragraph.startsWith('Use cases:')) {
      // Bold 'Use cases' and format the list
      return `<strong>${paragraph.split(':')[0]}:</strong> ${paragraph.split(':')[1].replace(/\n/g, '<br>')}`;
    } else {
      // Return regular paragraphs with spacing
      return `<p>${paragraph}</p>`;
    }
  });

  // Join the formatted paragraphs back into a single string
  return formattedParagraphs.join('\n\n');
}


app.post("/api/gemini", async (req, res) => {
  const { query } = req.body;

  try {
    // Generate the response using the Google Generative AI API
    const result = await model.generateContent(query);
    
    // Format the response with extra line spacing
    const formattedResponse = formatResponse(result.response.text());
    
    // Send the formatted response back to the client
    res.json({ answer: formattedResponse });
  } catch (error) {
    console.error("Error communicating with Gemini API", error);
    res.status(500).json({ error: "Failed to fetch response" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const corsOptions = {
  origin: "https://faizalahameds.github.io/audiogpt/", // Replace with your GitHub Pages URL
  methods: "GET,POST",
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));
