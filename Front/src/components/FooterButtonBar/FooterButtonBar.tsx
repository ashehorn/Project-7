import React from 'react';
import './footerbuttonbar.scss';
import { FaHome, FaRegPlusSquare } from 'react-icons/fa';
import { IoPersonCircleOutline } from "react-icons/io5";

interface FooterButtonBarProps {
  toggleProfilePage: () => void;
}

const FooterButtonBar: React.FC<FooterButtonBarProps> = ({ toggleProfilePage }) => {
  return (
    <div className="footer-button-bar">
      <a href="/dashboard" className="footer-button"><FaHome/></a>  
      <a href="/create" className="footer-button"><FaRegPlusSquare/></a>
      <button onClick={toggleProfilePage}><IoPersonCircleOutline /></button>
    </div>
  );
};

export default FooterButtonBar;
