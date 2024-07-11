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

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
      }
      try {
        const response = await axios.get<User>(`http://localhost:3000/api/user/${userId}`, {
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
        try {
          await axios.delete(`http://localhost:3000/api/user/${userId}`, {
            withCredentials: true,
          });
          window.location.href = '/';
        } catch (error) {
          console.error('Error deleting user:', error);
        }
    }

  return (
    <div className={`profile-page ${isOpen ? 'open' : ''}`}>
      <button onClick={toggleProfilePage} className="close-btn"><FaRegWindowClose /></button>
      <h2>Profile Page</h2>
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