import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/TopNavBar/TopNavBar';
import './App.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';

  return (
    <div id="app-container">
      {showNavbar && <Navbar />}
      <div className={`content ${showNavbar ? '' : 'full-height'}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;