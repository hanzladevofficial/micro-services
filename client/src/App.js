import { useState } from "react";
import PostCreate from "./PostCreate";
import PostList from "./PostList";

const App = () => {
  const [refreshPosts, setRefreshPosts] = useState(0);

  const handlePostCreated = () => {
    setRefreshPosts(prev => prev + 1);
  };

  return (
    <div className="container">
      <h1>Create Post</h1>
      <PostCreate onPostCreated={handlePostCreated} />
      <hr />
      <h1>Posts</h1>
      <PostList key={refreshPosts} />
    </div>
  );
};
export default App;
