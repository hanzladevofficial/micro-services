const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const app = express();
const axios = require("axios");
const cors = require("cors");
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  }),
);
const commentsByPostId = {};
app.get("/posts/:id/comments", (req, res) => {
  try {
    res.send(commentsByPostId[req.params.id] || []);
  } catch (error) {
    console.error("Error retrieving comments:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});

app.post("/posts/:id/comments", async (req, res) => {
  try {
    const id = randomBytes(4).toString("hex");
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).send({ status: "Error", message: "Content is required" });
    }
    
    const comment = {
      id,
      content,
      status: "pending",
    };
    commentsByPostId[req.params.id] = commentsByPostId[req.params.id] || [];
    commentsByPostId[req.params.id].push(comment);
    await axios.post("http://event-bus-srv:4005/events", {
      type: "CommentCreated",
      data: {
        id,
        content,
        postId: req.params.id,
        status: comment.status,
      },
    });
    res.status(201).send(comment);
  } catch (error) {
    console.error("Error creating comment:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.post("/events", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "CommentCreated") {
      const { id, content, postId, status } = data;
      if (!commentsByPostId[postId]) {
        commentsByPostId[postId] = [];
      }
      commentsByPostId[postId].push({ id, content, status });
      console.log("Comment Created Event Received:", data);
    }
    if (type === "CommentUpdated") {
      const { id, content, postId, status } = data;
      const comments = commentsByPostId[postId];
      if (comments) {
        const comment = comments.find((comment) => {
          return comment.id === id;
        });
        if (comment) {
          comment.status = status;
          comment.content = content;
        }
        console.log("Comment Updated Event Received:", data);
      }
    }
    if (type === "CommentModerated") {
      const { postId, id, status, content } = data;
      const comments = commentsByPostId[postId];
      if (comments) {
        const comment = comments.find((comment) => {
          return comment.id === id;
        });
        if (comment) {
          comment.status = status;
          await axios.post("http://event-bus-srv:4005/events", {
            type: "CommentUpdated",
            data: {
              id,
              status,
              postId,
              content,
            },
          });
        }
      }
    }
    console.log("Received Event:", req.body);
    res.send({});
  } catch (error) {
    console.error("Error handling event:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});

app.listen(4001, () => {
  console.log("Blog comments service running on port 4001");
});
