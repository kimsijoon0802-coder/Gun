import React, { useState, useEffect } from 'react';
import { Item, Gun, Armor, Consumable, ItemType } from '../types';
import { generateItemLore } from '../services/geminiService';
import StatBar from './StatBar';

interface ItemDetailsProps {
  item: Item;
  onPurchase: (item: Item) => void;
  isPurchased: boolean;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ item, onPurchase, isPurchased }) => {
  const [lore, setLore] = useState<string>('배경 이야기 생성 중...');
  const [isLoadingLore, setIsLoadingLore] = useState<boolean>(true);

  useEffect(() => {
    const fetchLore = async () => {
      setIsLoadingLore(true);
      const generatedLore = await generateItemLore(item);
      setLore(generatedLore);
      setIsLoadingLore(false);
    };
    fetchLore();
  }, [item]);

  const renderStats = () => {
    switch (item.type) {
      case ItemType.Weapon:
        const gun = item as Gun;
        return (
          <>
            <StatBar label="공격력" value={gun.attack} color="bg-red-500" />
            <StatBar label="정확도" value={gun.accuracy} color="bg-blue-500" />
            <StatBar label="연사력" value={gun.fireRate} color="bg-yellow-500" />
            <StatBar label="사거리" value={gun.range} color="bg-green-500" />
          </>
        );
      case ItemType.Armor:
        const armor = item as Armor;
        return <StatBar label="방어력" value={armor.defense} color="bg-sky-500" />;
      case ItemType.Consumable:
        const consumable = item as Consumable;
        return (
          <div className="text-center bg-gray-700/50 p-3 rounded-md">
            <p className="text-lg text-green-300">
                효과: {consumable.effect === 'heal' ? `체력 ${consumable.value} 회복` : `공격력 +${consumable.value}`}
                {consumable.duration && ` (${consumable.duration}턴 동안)`}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700 flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3">
        <img src={item.image} alt={item.name} className="w-full h-auto object-cover rounded-lg shadow-lg shadow-black/30" />
      </div>
      <div className="md:w-2/3 flex flex-col">
        <h2 className="text-3xl font-bold text-cyan-300">{item.name}</h2>
        <p className="text-gray-400 mt-2">{item.description}</p>
        
        <div className="my-6">
            <h4 className="font-bold text-cyan-200 mb-2 uppercase text-sm tracking-wider">배경 이야기</h4>
            <div className="bg-black/20 p-3 rounded-md min-h-[60px]">
                <p className={`text-gray-300 italic ${isLoadingLore ? 'animate-pulse' : ''}`}>{lore}</p>
            </div>
        </div>

        <div className="flex-grow space-y-3">
          {renderStats()}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
          <p className="text-3xl font-bold text-orange-400 flex-grow">{item.price.toLocaleString()} 크레딧</p>
          <button
            onClick={() => onPurchase(item)}
            disabled={isPurchased}
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-400 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 transform hover:scale-105 shadow-lg shadow-orange-500/20 disabled:shadow-none"
          >
            {isPurchased ? '구매 완료' : '구매하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
