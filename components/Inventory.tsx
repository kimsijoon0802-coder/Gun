import React from 'react';
import { Item, ItemType } from '../types';

interface InventoryProps {
  inventory: Item[];
  onEquip: (item: Item) => void;
  onUse: (item: Item) => void;
  equippedWeaponId?: number;
  equippedArmorId?: number;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onEquip, onUse, equippedWeaponId, equippedArmorId }) => {
  const renderItemActions = (item: Item) => {
    const isEquipped = (item.type === ItemType.Weapon && item.id === equippedWeaponId) ||
                       (item.type === ItemType.Armor && item.id === equippedArmorId);

    if (item.type === ItemType.Weapon || item.type === ItemType.Armor) {
      return (
        <button 
          onClick={() => onEquip(item)}
          disabled={isEquipped}
          className="text-xs font-bold py-1 px-3 rounded-full transition-colors duration-200 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isEquipped ? '장착됨' : '장착'}
        </button>
      );
    }
    if (item.type === ItemType.Consumable) {
      return (
        <button 
          onClick={() => onUse(item)}
          className="text-xs font-bold py-1 px-3 rounded-full transition-colors duration-200 bg-green-600 hover:bg-green-500"
        >
          사용
        </button>
      );
    }
    return null;
  };

  const renderGroup = (type: ItemType) => {
    const items = inventory.filter(item => item.type === type);
    if (items.length === 0) return null;

    return (
        <div key={type}>
            <h4 className="font-bold text-cyan-200 mt-4 mb-2 border-b border-cyan-500/20 pb-1">{type}</h4>
            <ul className="space-y-2">
            {items.map(item => (
                <li key={`${item.type}-${item.id}`} className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                <span className="text-gray-300">{item.name}</span>
                {renderItemActions(item)}
                </li>
            ))}
            </ul>
        </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
      <h3 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-wider">인벤토리</h3>
      {inventory.length === 0 ? (
        <p className="text-gray-400 text-center py-4">구매한 아이템이 없습니다.</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-2">
            {renderGroup(ItemType.Weapon)}
            {renderGroup(ItemType.Armor)}
            {renderGroup(ItemType.Consumable)}
        </div>
      )}
    </div>
  );
};

export default Inventory;
