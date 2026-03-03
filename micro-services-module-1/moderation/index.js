const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
app.use(bodyParser.json());

app.post("/events", async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log("Received Event:", req.body);
    
    if (type === "CommentCreated") {
      const { id, content, postId, status } = data;
      
      if (!id || !content || !postId) {
        return res.status(400).send({ status: "Error", message: "Missing required fields" });
      }
      
      const updatedStatus = content.includes("orange") ? "rejected" : "approved";

      await axios.post("http://event-bus-srv:4005/events", {
        type: "CommentModerated",
        data: {
          id,
          postId,
          content,
          status: updatedStatus,
        },
      });
    }
    res.send({});
  } catch (error) {
    console.error("Error handling event:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.listen(4003, () => {
  console.log("Listening on 4003");
});
