import React from 'react';
import './topNavBar.scss';
import logo from '../../assets/Groupomania_Logos/icon-left-font.svg?url';

interface NavbarProps {
  toggleProfilePage: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleProfilePage }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/dashboard"><img className="logo" src={logo} alt="logo" /></a>
      </div>
      <div className="navbar-links">
        <a href="/create">Create Post</a>
        <button onClick={toggleProfilePage}>Profile</button>
        <a href="/">Logout</a>
      </div>
    </nav>
  );
};

export default Navbar;


