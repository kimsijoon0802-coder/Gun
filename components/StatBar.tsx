import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  color?: string;
  max?: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color = 'bg-cyan-500', max = 100 }) => {
  const percentage = (value / max) * 100;

  const getDynamicColor = () => {
    if (percentage < 33) return 'bg-red-500';
    if (percentage < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const barColor = color ? color : getDynamicColor();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;
