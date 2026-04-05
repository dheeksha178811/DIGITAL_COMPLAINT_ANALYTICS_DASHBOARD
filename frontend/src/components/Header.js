import React from 'react';
import './Header.css';

const Header = ({ toggleSidebar, title = 'Dashboard' }) => {
  return (
    <header className="header">
      <button className="menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <h1 className="header-title">{title}</h1>
    </header>
  );
};

export default Header;
