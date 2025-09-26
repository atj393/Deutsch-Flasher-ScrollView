// src/components/BurgerMenu.jsx
import React from 'react';

const BurgerMenu = ({ isOpen, onClick, className = '' }) => {
  return (
    <button
      className={`burger-menu-btn ${isOpen ? 'active' : ''} ${className}`}
      onClick={onClick}
      title={isOpen ? 'Close Settings' : 'Open Settings'}
      aria-label={isOpen ? 'Close Settings' : 'Open Settings'}
    >
      <span className="material-icons">
        {isOpen ? 'close' : 'menu'}
      </span>
    </button>
  );
};

export default BurgerMenu;