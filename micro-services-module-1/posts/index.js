const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const app = express();
const axios = require("axios");
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  }),
);
const post = {};
app.post("/posts/create", async (req, res) => {
  try {
    const id = randomBytes(4).toString("hex");
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).send({ status: "Error", message: "Title is required" });
    }
    
    post[id] = {
      id,
      title,
    };
    await axios.post("http://event-bus-srv:4005/events", {
      type: "PostCreated",
      data: {
        id,
        title,
      },
    });
    res.status(201).send(post[id]);
  } catch (error) {
    console.error("Error creating post:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.post("/events", (req, res) => {
  try {
    console.log("Received Event:", req.body);
    res.send({});
  } catch (error) {
    console.error("Error handling event:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.listen(4000, () => {
  console.log("Blog posts service running on port 4000");
});
