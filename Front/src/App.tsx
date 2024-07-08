import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/TopNavBar/TopNavBar';
import FooterButtonBar from './components/FooterButtonBar/FooterButtonBar';
import ProfilePage from './components/ProfilePage/ProfilePage';
import './App.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';
  const showFooter = location.pathname !== '/';

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleProfilePage = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div id="app-container">
      {showNavbar && <Navbar toggleProfilePage={toggleProfilePage} />}
      <div className={`content ${showNavbar ? '' : 'full-height'}`}>
        {children}
      </div>
      {showFooter && <FooterButtonBar toggleProfilePage={toggleProfilePage} />}
      <ProfilePage isOpen={isProfileOpen} toggleProfilePage={toggleProfilePage} />
    </div>
  );
};

export default Layout;