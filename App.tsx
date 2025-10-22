import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ItemCard from './components/GunCard';
import ItemDetails from './components/GunDetails';
import Inventory from './components/Inventory';
import PlayerStats from './components/PlayerStats';
import BattleSimulator from './components/BattleSimulator';
import { Item, Gun, Armor, Consumable, PlayerStats as PlayerStatsType } from './types';
import { GUNS, ARMOR, CONSUMABLES, ItemType, INITIAL_PLAYER_STATS } from './constants';

const App: React.FC = () => {
  const [playerCredits, setPlayerCredits] = useState<number>(10000);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(GUNS[0]);
  const [equippedWeapon, setEquippedWeapon] = useState<Gun | null>(null);
  const [equippedArmor, setEquippedArmor] = useState<Armor | null>(null);
  const [activeTab, setActiveTab] = useState<ItemType>(ItemType.Weapon);
  const [playerStats, setPlayerStats] = useState<PlayerStatsType>(INITIAL_PLAYER_STATS);

  const shopItems = useMemo(() => {
    switch (activeTab) {
      case ItemType.Weapon:
        return GUNS;
      case ItemType.Armor:
        return ARMOR;
      case ItemType.Consumable:
        return CONSUMABLES;
      default:
        return [];
    }
  }, [activeTab]);

  const handlePurchase = (item: Item) => {
    if (playerCredits >= item.price) {
      if (inventory.find(invItem => invItem.id === item.id && invItem.type === item.type)) {
          alert("이미 구매한 아이템입니다.");
          return;
      }
      setPlayerCredits(prev => prev - item.price);
      setInventory(prev => [...prev, item]);
    } else {
      alert('크레딧이 부족합니다!');
    }
  };

  const handleEquip = (item: Item) => {
    if (item.type === ItemType.Weapon) {
        setEquippedWeapon(item as Gun);
    } else if (item.type === ItemType.Armor) {
        setEquippedArmor(item as Armor);
    }
  };

  const handleUse = (item: Item) => {
    if (item.type === ItemType.Consumable) {
        const consumable = item as Consumable;
        if (consumable.effect === 'heal') {
            setPlayerStats(prev => ({
                ...prev,
                health: Math.min(prev.maxHealth, prev.health + consumable.value)
            }));
            // 소모품은 사용 후 인벤토리에서 제거
            setInventory(prev => prev.filter(invItem => invItem.id !== item.id || invItem.type !== item.type));
        }
        // 다른 효과 (예: 공격력 부스트)는 전투 중에만 적용되도록 전투 시뮬레이터에서 처리할 수 있습니다.
        alert(`${item.name}을(를) 사용했습니다!`);
    }
  };
  
  const calculatedPlayerStats = useMemo<PlayerStatsType>(() => {
    const totalAttack = INITIAL_PLAYER_STATS.attack + (equippedWeapon?.attack ?? 0);
    const totalDefense = INITIAL_PLAYER_STATS.defense + (equippedArmor?.defense ?? 0);
    return { ...playerStats, attack: totalAttack, defense: totalDefense };
  }, [playerStats, equippedWeapon, equippedArmor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/40 to-gray-900 font-sans">
      <Header playerCredits={playerCredits} />
      <main className="container mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <PlayerStats stats={calculatedPlayerStats} weapon={equippedWeapon} armor={equippedArmor} />
          <Inventory 
            inventory={inventory} 
            onEquip={handleEquip} 
            onUse={handleUse}
            equippedWeaponId={equippedWeapon?.id}
            equippedArmorId={equippedArmor?.id}
          />
          <BattleSimulator playerStats={calculatedPlayerStats} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-wider">상점</h2>
            <div className="flex border-b border-cyan-500/30 mb-4">
              {(Object.values(ItemType) as ItemType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedItem(
                      tab === ItemType.Weapon ? GUNS[0] :
                      tab === ItemType.Armor ? ARMOR[0] :
                      CONSUMABLES[0]
                    );
                  }}
                  className={`px-4 py-2 text-sm font-bold uppercase transition-colors duration-200 ${
                    activeTab === tab 
                      ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400' 
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[400px] overflow-y-auto pr-2">
              {shopItems.map(item => (
                <ItemCard key={`${item.type}-${item.id}`} item={item} onSelect={setSelectedItem} />
              ))}
            </div>
          </div>
          {selectedItem && (
            <ItemDetails
              item={selectedItem}
              onPurchase={handlePurchase}
              isPurchased={!!inventory.find(invItem => invItem.id === selectedItem.id && invItem.type === selectedItem.type)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
