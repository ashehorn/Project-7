import React from 'react';
import axios from 'axios';
import './topNavBar.scss';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import logo from '../../assets/Groupomania_Logos/icon-left-font.svg?url';

interface NavbarProps {
  toggleProfilePage: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleProfilePage }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/user/logout', {}, { withCredentials: true });
      if (response.status === 200) {
        logout();
        navigate('/');
      } else {
        console.error('Failed to log out:', response.statusText);
        const message = 'An error occurred while logging out.';
        alert(message);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      const message = 'An error occurred while logging out.';
      alert(message);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/dashboard"><img className="logo" src={logo} alt="logo" /></a>
      </div>
      <div className="navbar-links">
        <a href="/create">Create Post</a>
        <button className='navbar-button' onClick={toggleProfilePage}>Profile</button>
        {isAuthenticated && <button className='navbar-button' onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
};

export default Navbar;


