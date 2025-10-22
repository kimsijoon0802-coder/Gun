import React from 'react';
import { Item, ItemType } from '../types';

interface ItemCardProps {
  item: Item;
  onSelect: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
    const typeColorClasses = {
        [ItemType.Weapon]: 'bg-red-500/20 text-red-300 border-red-500/50',
        [ItemType.Armor]: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        [ItemType.Consumable]: 'bg-green-500/20 text-green-300 border-green-500/50',
    };

  return (
    <div 
      className="bg-gray-800/60 rounded-lg overflow-hidden cursor-pointer group border border-gray-700 hover:border-cyan-400 transition-all duration-300 transform hover:-translate-y-1"
      onClick={() => onSelect(item)}
    >
      <div className="h-32 w-full overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">{item.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${typeColorClasses[item.type]}`}>
                {item.type}
            </span>
        </div>
        <p className="text-sm text-gray-400 mt-1 truncate">{item.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-lg font-semibold text-orange-400">{item.price.toLocaleString()} C</p>
          <button className="text-xs bg-gray-700 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100">
            상세 정보
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
