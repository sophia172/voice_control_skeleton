const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../dist")));

app.get("/api/signed-url", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get signed URL");
    }

    const data = await response.json();
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});

//API route for getting Agent ID, used for public agents
app.get("/api/getAgentId", (req, res) => {
  const agentId = process.env.AGENT_ID;
  res.json({
    agentId: `${agentId}`,
  });
});

// New endpoint to process movement commands
app.post("/api/process-command", async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }
    
    console.log("Received command:", command);
    
    // For now, we'll just echo back the command
    // In a more advanced implementation, you could use a more sophisticated NLP model
    // or integrate with ElevenLabs' agent capabilities
    
    // Simple command processing logic
    const processedCommand = {
      originalCommand: command,
      timestamp: new Date().toISOString(),
      processed: true
    };
    
    res.json(processedCommand);
  } catch (error) {
    console.error("Error processing command:", error);
    res.status(500).json({ error: "Failed to process command" });
  }
});

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
