// src/components/SearchButton.jsx
import React from 'react';

const SearchButton = ({ onClick }) => {
  return (
    <button 
      className="search-btn"
      onClick={onClick}
      title="Browse & Search"
    >
      <span className="material-icons">search</span>
    </button>
  );
};

export default SearchButton;