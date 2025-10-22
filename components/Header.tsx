import React from 'react';

interface HeaderProps {
  playerCredits: number;
}

const Header: React.FC<HeaderProps> = ({ playerCredits }) => {
  return (
    <header className="bg-gray-800/30 backdrop-blur-md sticky top-0 z-10 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-widest uppercase text-cyan-300">
          <span className="text-white">배틀 로얄</span> 무기고
        </h1>
        <div className="bg-gray-900/50 border border-orange-400/50 rounded-md px-4 py-2 text-right">
          <span className="text-sm uppercase text-gray-400">크레딧</span>
          <p className="text-xl font-bold text-orange-400">{playerCredits.toLocaleString()}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;