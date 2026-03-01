import { useState, useEffect } from "react";
import axios from "axios";
import CommentCreate from "./CommentCreate";
import CommentList from "./CommentList";

const PostList = () => {
  const [posts, setPosts] = useState({});
  useEffect(() => {
    const fetchPosts = async () => {
      const res = await axios.get("http://posts.com/posts");
      setPosts(res.data);
    };
    fetchPosts();
  }, []);

  const refetchAfterCreation = async (postId) => {
    const res = await axios.get("http://posts.com/posts");
    setPosts(res.data);
  };

  const renderedPosts = Object.values(posts).map((post) => {
    return (
      <div
        className="card"
        style={{ width: "30%", marginBottom: "20px" }}
        key={post.id}
      >
        <div className="card-body">
          <h3>{post.title}</h3>
          <CommentList comments={post.comments} />
          <CommentCreate
            postId={post.id}
            onCommentCreated={() => refetchAfterCreation(post.id)}
          />
        </div>
      </div>
    );
  });

  return (
    <div className="d-flex flex-row flex-wrap justify-content-between">
      {renderedPosts}
    </div>
  );
};

export default PostList;
