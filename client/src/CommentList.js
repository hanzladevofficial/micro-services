const CommentList = ({ comments }) => {
  const renderedComments = comments?.map((comment) => {
    if (comment.status === "approved")
      return <li key={comment.id}>{comment.content}</li>;
    else if (comment.status === "pending")
      return <li key={comment.id}>This comment is awaiting moderation</li>;
    else if (comment.status === "rejected")
      return <li key={comment.id}>This comment has been rejected</li>;
  });

  return <ul>{renderedComments}</ul>;
};

export default CommentList;
