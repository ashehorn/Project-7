import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './newPostForm.scss';

// axios.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response && error.response.status === 302) {
//       window.location.href = error.response.headers.location;
//     }
//     return Promise.reject(error);
//   }
// );

export default function NewPostForm() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);
    const navigate = useNavigate();

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    };

    const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFiles(event.target.files);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const userId = localStorage.getItem('userId');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (userId) {
            formData.append('created_by', userId);
        }

        if (files) {
            Array.from(files).forEach((file) => {
                formData.append('media', file); 
            });
        }

        try {
            const response = await axios.post('https://groupomania-reddit-clone-back.onrender.com/api/post', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            console.log('Post created:', response.data);
            setTitle('');
            setContent('');
            setFiles(null);

            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating post:', error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Server responded with:', error.response.data);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                } else {
                    console.error('Axios error message:', error.message);
                }
            } else {
                console.error('Unexpected error:', error);
            }
        }
    };

    return (
        <div className="create-post">
            <h2>Create Post</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={title}
                        onChange={handleTitleChange}
                        required
                        placeholder='Title'
                        maxLength={40}
                    />
                </div>

                <div className="form-group">
                    <textarea
                        id="content"
                        value={content}
                        name="content"
                        onChange={handleContentChange}
                        required
                        placeholder='Content'
                    />
                </div>
                <div className="form-group">
                    <input
                        type="file"
                        id="media"
                        name="media"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>
                <button id="post" type="submit">Post</button>
            </form>
        </div>
    );
}

