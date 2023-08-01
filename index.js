const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const axios = require("axios");
const cors = require("cors");
const Vibrant = require("node-vibrant");
const path = require("path");
const Clarifai = require("clarifai");
const app = express();

app.use(cors());
require('dotenv').config();

const PORT = process.env.PORT || 5000;
// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/imageanalyzer", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((data) => {
    console.log(`Mongodb connected with server: ${data.connection.host}`);
  });
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Create a schema and model for storing image data in MongoDB
const ImageSchema = new mongoose.Schema({
  filename: String,
  dimensions: {
    width: Number,
    height: Number,
  },
  dominantColors: [String],
  objectRecognition: [String],
});

const ImageModel = mongoose.model("Image", ImageSchema);

// Set up multer for file uploads
const upload = multer({
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB file size limit
  },
});

const clarifaiClient = new Clarifai.App({
  apiKey: process.env.CLARIFAI_API_KEY,
});

// console.log(clarifaiClient)

// Function to filter and extract object names
const extractObjectNames = (clarifaiResponse) => {
  const objects = clarifaiResponse?.outputs[0]?.data?.concepts || [];
  const objectNames = [];

  for (const concept of objects) {
    if (concept?.name && concept?.value >= 0.95) {
      objectNames.push(concept.name);
    }
  }

  return objectNames;
};

// Endpoint for image upload and analysis
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    // console.log(req.file)
    // Get image dimensions
    const { width, height } = await sharp(buffer).metadata();
    //  console.log(width)
    //  console.log(height)

    // Get dominant colors
    const vibrantPalette = await Vibrant.from(buffer).getPalette();
    const colors = Object.keys(vibrantPalette).map((key) =>
      vibrantPalette[key].getHex()
    );
    // console.log(colors)
    // Implement object recognition

    const clarifaiResponse = await clarifaiClient.models.predict(
      Clarifai.GENERAL_MODEL,
      { base64: buffer.toString("base64") }
    );

    const recognizedObjects = extractObjectNames(clarifaiResponse);

    // console.log(recognizedObjects)

    // Save image data to MongoDB
    const image = new ImageModel({
      filename: originalname,
      dimensions: { width, height },
      dominantColors: colors,
      objectRecognition: recognizedObjects || [], // Set the recognized objects here
    });

    await image.save();

    res.json({
      message: "Image analysis completed successfully",
      data: image,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error analyzing the image",
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
