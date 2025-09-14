import { FaRegPlusSquare } from 'react-icons/fa';
import { IoPersonCircleOutline } from "react-icons/io5";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../components/AuthContext';
import './footerbuttonbar.scss'

interface FooterButtonBarProps {
  toggleProfilePage: () => void;
}

const FooterButtonBar: React.FC<FooterButtonBarProps> = ({ toggleProfilePage }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const handleLogout = async () => {
    try {
      const response = await axios.post('https://groupomania-reddit-clone-back.onrender.com/api/user/logout', {}, { withCredentials: true });
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
    <div className="footer-button-bar">
      {isAuthenticated && (
        <>
          <button onClick={handleLogout} className="footer-button" id='logoutbtn'><FaArrowRightFromBracket /></button>
          <button onClick={() => navigate('/create')} className="footer-button"><FaRegPlusSquare /></button>
          <button id='profile-button' onClick={toggleProfilePage} className="footer-button"><IoPersonCircleOutline /></button>
        </>
      )}
    </div>
  );
};

export default FooterButtonBar;
