import './topNavBar.scss';
import React from'react';
import './topNavBar.scss';
import logo from '../../assets/Groupomania_Logos/icon-left-font.svg?url'

const Navbar = () => {
  return (
    <nav className="navbar">
        <div className='navbar-logo'>
          <img className="logo"src={logo} alt="logo" />
        </div>
      <div className="navbar-links">
        <a href="/create">Create Post</a>
        <a href="/">Logout</a>
        <a href="/profile">Profile</a>
      </div>
    </nav>
  );
};

export default Navbar;


