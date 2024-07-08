import { useState, useEffect } from 'react';
import axios from 'axios';
import './comment.scss';
import { FaPaperclip, FaTrash } from 'react-icons/fa';

interface Comment {
  id: number;
  postId: number;
  created_by: number;
  content: string;
  created_datetime: string;
  mediaUrls?: string[];
}

interface CommentsProps {
  postId: number;
}

function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const userId = parseInt(localStorage.getItem('userId') || '0');

  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await axios.get(`http://localhost:3000/api/comment/${postId}`, {
          withCredentials: true,
        });
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }

    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    const formData = new FormData();
    if (userId) {
      formData.append('created_by', userId.toString());
    }
    formData.append('postId', postId.toString());
    formData.append('content', newComment);
    selectedFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const response = await axios.post('http://localhost:3000/api/comment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      const newCommentData = response.data;

      const mediaUrls = await Promise.all(
        newCommentData.media.map(async (media: { media: string }) => {
          const urlResponse = await axios.get(`http://localhost:3000/api/comment/media-url/${media.media}`);
          return urlResponse.data.url;
        })
      );

      setComments((prevComments) => [
        ...prevComments,
        { ...newCommentData, mediaUrls, content: newCommentData.comment_body },
      ]);

      setNewComment('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await axios.delete(`http://localhost:3000/api/comment/${commentId}`, {
        withCredentials: true,
      });

      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="comments">
      <h3>Comments</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="comment">
          <p>{comment.content}</p>
          {comment.mediaUrls && comment.mediaUrls.map((url, index) => (
            <img key={index} src={url} alt="comment media" />
          ))}
          <small>{new Date(comment.created_datetime).toLocaleString()}</small>
          {comment.created_by === userId && (
            <button onClick={() => handleDeleteComment(comment.id)}>
              <FaTrash/>
            </button>
          )}
        </div>
      ))}
      <div className="add-comment">
        <div className="comment-input-wrapper">
          <input 
            type="text" 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            placeholder="Add a comment" 
          />
          <label htmlFor="file-upload" className="custom-file-upload">
            <FaPaperclip/>
          </label>
          <input 
            id="file-upload" 
            type="file" 
            multiple 
            onChange={handleFileChange} 
          />
        </div>
        <button onClick={handleAddComment}>Comment</button>
      </div>
    </div>
  );
}

export default Comments;
