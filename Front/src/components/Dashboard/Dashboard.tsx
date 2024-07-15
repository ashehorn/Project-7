import React, { useState, useEffect } from 'react';
import './dashboard.scss';
import ImageCarousel from '../ImageCarousel/Carousel';
import Comments from '../Comments/Comments';
import axios from 'axios';
import { FaThumbsUp, FaThumbsDown, FaComment, FaTrash, FaEdit, FaEyeSlash } from 'react-icons/fa';
import RelativeTime from '../Time/Time';
import { markPostAsSeen, isPostSeen } from '../../../utils/postUtils';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 302) {
      window.location.href = error.response.headers.location;
    }
    return Promise.reject(error);
  }
);

interface Media {
  id: number;
  postId: number;
  media: string;
}

interface Post {
  id: number;
  created_by: number;
  created_datetime: string;
  post_data: {
    title: string;
    content: string;
  };
  userId: number | null;
  media: Media[];
  mediaUrls: string[];
  user: {
    id: number;
    username: string;
  };
  likes: { id: number }[];
  dislikes: { id: number }[];
  likesCount: number;
  dislikesCount: number;
  hasLiked: boolean;
  hasDisliked: boolean;
}

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
  const [editedPost, setEditedPost] = useState<{ [key: number]: { title: string; content: string } }>({});
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get('http://localhost:3000/api/post', {
          withCredentials: true,
        });
        console.log('Fetched posts:', response.data);
        if (Array.isArray(response.data)) {
          const updatedPosts = response.data.map((post: Post) => ({
            ...post,
            hasLiked: post.likes.some((user) => user.id === userId),
            hasDisliked: post.dislikes.some((user) => user.id === userId),
            likesCount: post.likes.length,
            dislikesCount: post.dislikes.length,
          }));
          setPosts(updatedPosts);
        } else {
          console.error('Expected an array of posts but got:', response.data);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }

    fetchPosts();
  }, [userId]);

  const toggleComments = (postId: number) => {
    setShowComments((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };

  const handleLikePost = async (postId: number) => {
    try {
      await axios.post('http://localhost:3000/api/post/like', {
        postId,
      }, {
        withCredentials: true,
      });
  
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            let hasDisliked = undefined;
            const hasLiked = !post.hasLiked;
            hasDisliked = post.hasDisliked ? !hasDisliked : post.hasDisliked;
            const newLikesCount = hasLiked ? post.likesCount + 1 : post.likesCount - 1;
            const newDislikesCount = hasDisliked ? post.dislikesCount - 1 : post.dislikesCount;
  
            return {
              ...post,
              likesCount: newLikesCount,
              dislikesCount: newDislikesCount,
              hasLiked,
              hasDisliked: hasDisliked ? false : post.hasDisliked,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDislikePost = async (postId: number) => {
    try {
      await axios.post('http://localhost:3000/api/post/dislike', {
        postId,
      }, {
        withCredentials: true,
      });
  
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            let hasLiked = undefined;
            const hasDisliked = !post.hasDisliked;
            hasLiked = post.hasLiked ? !hasLiked : post.hasLiked;
            const newDislikesCount = hasDisliked ? post.dislikesCount + 1 : post.dislikesCount - 1;
            const newLikesCount = hasLiked ? post.likesCount - 1 : post.likesCount;
  
            return {
              ...post,
              dislikesCount: newDislikesCount >= 0 ? newDislikesCount : 0,
              likesCount: newLikesCount >= 0 ? newLikesCount : 0,
              hasDisliked,
              hasLiked: hasLiked ? false : post.hasLiked,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await axios.delete(`http://localhost:3000/api/post/${postId}`, {
        withCredentials: true,
      });

      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = (postId: number) => {
    setEditMode((prevState) => ({
      ...prevState,
      [postId]: true,
    }));
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setEditedPost((prevState) => ({
        ...prevState,
        [postId]: { title: post.post_data.title, content: post.post_data.content },
      }));
    }
  };

  const handleSavePost = async (postId: number) => {
    try {
      await axios.put(`http://localhost:3000/api/post/${postId}`, editedPost[postId], {
        withCredentials: true,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, post_data: editedPost[postId] } : post
        )
      );

      setEditMode((prevState) => ({
        ...prevState,
        [postId]: false,
      }));
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleMarkAsSeen = (postId: number) => {
    markPostAsSeen(postId);
    setPosts((prevPosts) => [...prevPosts]); // Force re-render to update seen status
  };

  return (
    <div className="dashboard">
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map((post, index) => (
          <div key={index} className="post">
            {editMode[post.id] ? (
              <div className='edit-post-container'>
                <input
                className='edit-title'
                  type="text"
                  value={editedPost[post.id]?.title || ''}
                  onChange={(e) =>
                    setEditedPost((prevState) => ({
                      ...prevState,
                      [post.id]: { ...prevState[post.id], title: e.target.value },
                    }))
                  }
                />
                <textarea
                className='edit-content'
                  value={editedPost[post.id]?.content || ''}
                  onChange={(e) =>
                    setEditedPost((prevState) => ({
                      ...prevState,
                      [post.id]: { ...prevState[post.id], content: e.target.value },
                    }))
                  }
                />
                <button className='edit-save' onClick={() => handleSavePost(post.id)}>Save</button>
                <button className='edit-cancel' onClick={() => setEditMode((prevState) => ({ ...prevState, [post.id]: false }))}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="post-header">
                  <div className='owner-info'>
                    <p id='post-owner-username'>{post.user.username}</p>
                    <small><RelativeTime datetime={post.created_datetime} /></small>
                    {!isPostSeen(post.id) && (
                    <button className="unseen-button" onClick={() => handleMarkAsSeen(post.id)}>
                      <FaEyeSlash className="unseen-icon" />
                    </button>
                  )}
                  </div>
                  <div className='post-owner-actions'>
                    {post.created_by === userId && (
                      <>
                        <FaEdit className='action' onClick={() => handleEditPost(post.id)} style={{ cursor: 'pointer' }} />
                        <FaTrash className='action' onClick={() => handleDeletePost(post.id)} style={{ cursor: 'pointer' }} />
                      </>
                    )}
                  </div>
                </div>
                <h2>{post.post_data.title}</h2>
                <p className='post-content'>{post.post_data.content}</p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="media">
                    <ImageCarousel images={post.mediaUrls} />
                  </div>
                )}
                <div className="post-footer-icons">
                  <FaThumbsUp
                    onClick={() => handleLikePost(post.id)}
                    style={{ cursor: 'pointer', color: post.hasLiked ? 'blue' : 'inherit' }}
                  />
                  <p>{post.likesCount}</p>
                  <FaThumbsDown
                    onClick={() => handleDislikePost(post.id)}
                    style={{ cursor: 'pointer', color: post.hasDisliked ? 'red' : 'inherit' }}
                  />
                  <p>{post.dislikesCount}</p>
                  <FaComment onClick={() => toggleComments(post.id)} style={{ cursor: 'pointer' }} />
                  
                </div>
              </>
            )}
            {showComments[post.id] && <Comments postId={post.id} />}
          </div>
        ))
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
}

export default Dashboard;
