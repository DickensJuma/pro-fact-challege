const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const random = require("lodash.shuffle");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static("static"));


// Connect to MongoDB using Mongoose
mongoose
  .connect(
    "mongodb+srv://dickens:ugPUWKvrnAuiTs8@cluster0.yeyah.mongodb.net/foota?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Create a schema for the football players
const footballPlayerSchema = new mongoose.Schema({
  name: String,
  facts: [String],
});

// Create a model for the football players
const FootballPlayer = mongoose.model("FootballPlayer", footballPlayerSchema);

// Create a schema for users
const userSchema = new mongoose.Schema({
  username: String,
  ipAddress: String, // Add ipAddress field to store the user's IP address
});

const User = mongoose.model("User", userSchema);

let currentPlayer = null;
let guessesRemaining = 0;

async function startNewGame() {
  let footballPlayers = await FootballPlayer.find();

  // shauffle the football players
  footballPlayers = random(footballPlayers);

  if (footballPlayers.length === 0) {
    return { message: "No players available for a new game." };
  }

  currentPlayer = await footballPlayers.pop();
  console.log(currentPlayer.name);
  guessesRemaining = 4;


  return {
    message:
      "New game started! Click on the <strong>'Get Fun Facts'</strong> button to get started. 👆",
    playerName: currentPlayer.name,
    guessesRemaining: guessesRemaining,
  };
}

function getFunFacts() {
  if (!currentPlayer) {
    return { message: "No active game. Start a new game to get facts." };
  }

  return { facts: currentPlayer.facts };
}

function makeGuess(userGuess) {
  if (!currentPlayer) {
    return { message: "No active game. Start a new game to make a guess." };
  }

  const playerName = currentPlayer.name.toLowerCase();
  userGuess = userGuess.trim().toLowerCase();

  if (!userGuess) {
    return { message: "Invalid input." };
  }

  if (playerName.includes(userGuess)) {
    return { message: "Correct guess!", playerName: currentPlayer.name };
  } else {
    guessesRemaining--;

    if (guessesRemaining > 0) {
      return {
        message: `Incorrect guess! You have ${guessesRemaining} guesses remaining.`,
      };
    } else {
      return {
        message: `Sorry, you're out of guesses. The correct answer is ${currentPlayer.name}.`,
      };
    }
  }
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/static/index.html");
});

app.get("/api/footballPlayers", async (req, res) => {
  try {
    const footballPlayers = await FootballPlayer.find();
    res.json(footballPlayers);
  } catch (error) {
    console.error("Error fetching football players:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching football players." });
  }
});

app.post("/api/game/start", async (req, res) => {
  function generateRandomUsername() {
    // List of adjectives and nouns to use for username generation
    const adjectives = [
      "Happy",
      "Sunny",
      "Lucky",
      "Creative",
      "Cool",
      "Awesome",
    ];
    const nouns = ["Coder", "Explorer", "Gamer", "Dreamer", "Artist", "Ninja"];

    // Select a random adjective and noun
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    // Combine the selected words to create the username
    const username = `${randomAdjective}${randomNoun}`;

    return username;
  }
  let footballPlayers = await FootballPlayer.find();
  // shauffle the football players
  footballPlayers = random(footballPlayers);

  // Example usage
  const randomUsername = generateRandomUsername();
  console.log(randomUsername); // Output: "HappyCoder" or some other random combination

  await User.create({ username: randomUsername, ipAddress: req.ip });
  console.log("User created successfully");
  const response = await startNewGame();
  res.json(response);
});

app.get("/api/game/facts", async (req, res) => {
  const response = getFunFacts();
  res.json(response);
});

app.post("/api/game/guess", (req, res) => {
  const userGuess = req.body.userGuess;
  const response = makeGuess(userGuess);
  res.json(response);
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
