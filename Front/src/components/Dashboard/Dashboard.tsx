import { useState, useEffect } from 'react';
import './dashboard.scss';
import ImageCarousel from '../ImageCarousel/Carousel';
import axios from 'axios';
import { FaThumbsUp, FaThumbsDown, FaComment } from 'react-icons/fa';

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
}

function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get('http://localhost:3000/api/post', {
          withCredentials: true,
        });
        console.log('Fetched posts:', response);
        if (Array.isArray(response.data)) {
          setPosts(response.data);
          
        } else {
          console.error('Expected an array of posts but got:', response.data);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div className="dashboard">
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map((post, index) => (
          <div key={index} className="post">
            <h2>{post.post_data.title}</h2>
            <p>{post.post_data.content}</p>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="media">
                <ImageCarousel images={post.mediaUrls} />
              </div>
            )}
            <div className="post-footer-icons">
              <FaThumbsUp/>
              <FaThumbsDown/>
              <FaComment/> 
            </div>
          </div>
        ))
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
}

export default Dashboard;