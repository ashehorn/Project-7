import React, { useState, useEffect } from 'react';
import './dashboard.css';
import ImageCarousel from '../ImageCarousel/Carousel';
import axios from 'axios';


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
            <h1>Dashboard</h1>
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
                    </div>
                ))
            ) : (
                <p>No posts available</p>
            )}
        </div>
    );
}

export default Dashboard;