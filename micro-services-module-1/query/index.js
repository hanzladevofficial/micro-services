const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const axios = require("axios");
app.use(cors("http://client-srv:3000"));
app.use(bodyParser.json());

const posts = {};
const handleEvents = (type, data) => {
  try {
    if (type === "PostCreated") {
      const { id, title } = data;
      if (!id || !title) {
        throw new Error("Missing required fields for PostCreated");
      }
      posts[id] = {
        id,
        title,
        comments: [],
      };
    } else if (type === "CommentCreated") {
      const { id, content, postId, status } = data;
      if (!posts[postId]) {
        throw new Error(`Post with id ${postId} not found`);
      }
      posts[postId].comments.push({ id, content, status });
    } else if (type === "CommentUpdated") {
      const { id, content, postId, status } = data;
      const post = posts[postId];
      if (!post) {
        throw new Error(`Post with id ${postId} not found`);
      }
      const comment = post.comments.find((comment) => {
        return comment.id === id;
      });
      if (comment) {
        comment.content = content;
        comment.status = status;
      }
    } else {
      console.log("Unknown event type:", type);
    }
  } catch (error) {
    console.error("Error handling event:", error.message);
  }
};
app.get("/posts", (req, res) => {
  try {
    res.send(posts);
  } catch (error) {
    console.error("Error retrieving posts:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.get("/posts/:id/comments", (req, res) => {
  try {
    const post = posts[req.params.id];
    if (!post) {
      return res.status(404).send({ status: "Error", message: "Post not found" });
    }
    res.send(post.comments);
  } catch (error) {
    console.error("Error retrieving comments:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.post("/events", (req, res) => {
  try {
    const { type, data } = req.body;
    handleEvents(type, data);
    res.send({});
  } catch (error) {
    console.error("Error handling event:", error.message);
    res.status(500).send({ status: "Error", message: error.message });
  }
});
app.listen(4002, async () => {
  console.log("Listening on 4002");
  try {
    const res = await axios.get("http://event-bus-srv:4005/events");
    for (let event of res.data) {
      console.log("Processing event:", event.type);
      handleEvents(event.type, event.data);
    }
  } catch (error) {
    console.error("Error fetching events on startup:", error.message);
  }
});
