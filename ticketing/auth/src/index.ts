import express from "express";

const app = express();
app.use(express.json());
app.get("/api/users", (req, res) => {
  res.json({ message: "hello world" });
});
app.listen(3000, () => {
  console.log("server is running on port 3000");
});
