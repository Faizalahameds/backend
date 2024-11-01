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
function formatResponse(text) {
  // Remove unnecessary markdown formatting
  let formattedText = text
    .replace(/\*\*|\*/g, "")        // Remove bold/italic markers
    .replace(/`{3,}/g, "")          // Remove code block markers
    .replace(/```python/g, "")      // Remove Python-specific markers
    .replace(/#+\s/g, "")           // Remove heading tags
    .replace(/\n{2,}/g, "\n\n")     // Ensure paragraphs are separated by two line breaks
    .replace(/\n/g, "\n\n");        // Convert single line breaks to double

  return formattedText;
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
