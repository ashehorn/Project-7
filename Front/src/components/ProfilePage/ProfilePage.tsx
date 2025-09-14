import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './profilepage.scss';
import { FaRegWindowClose } from "react-icons/fa";

interface ProfilePageProps {
  isOpen: boolean;
  toggleProfilePage: () => void;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ isOpen, toggleProfilePage }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
      }
      try {
        const response = await axios.get<User>(`https://groupomania-reddit-clone-back.onrender.com/api/user/${userId}`, {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const deleteUser = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No userId found in localStorage');
      setError('No user ID found. Please log in again.');
      return;
    }
    console.log('Attempting to delete user with ID:', userId); // Log userId
    try {
      await axios.delete(`https://groupomania-reddit-clone-back.onrender.com/api/user/${userId}`, {
        withCredentials: true,
      });
      console.log('User deleted successfully');
      localStorage.removeItem('userId');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user. Please try again later.');
    }
  }

  return (
    <div className={`profile-page ${isOpen ? 'open' : ''}`}>
      <button onClick={toggleProfilePage} className="close-btn"><FaRegWindowClose /></button>
      <h2>Profile Page</h2>
      {error && <p className="error">{error}</p>}
      {user ? (
        <div className='profile-info'>
          <p className='user-profile-info'><span>First Name:</span> {user.first_name}</p>
          <p className='user-profile-info'><span>Last Name:</span> {user.last_name}</p>
          <p className='user-profile-info'><span>Username:</span> {user.username}</p>
          <p className='user-profile-info'><span>Email:</span> {user.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <button className='delete-user' onClick={deleteUser}>Delete User</button>
    </div>
  );
};

export default ProfilePage;