import React, { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
const ItemType = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    CONSUMABLE: 'Consumable',
};

const View = {
    SHOP: 'SHOP',
    PLAYER: 'PLAYER',
    BATTLE: 'BATTLE',
};

// --- INTERFACES ---
interface Item {
    id: number;
    type: string;
    name: string;
    price: number;
    damage?: number;
    accuracy?: number;
    fireRate?: number;
    defense?: number;
    effect?: {
        type: string;
        amount: number;
        duration?: number;
    };
}

interface PlayerStats {
    hp: number;
    attack: number;
    defense: number;
    gold: number;
}

interface ActiveEffect {
    type: string;
    amount: number;
    duration: number;
    itemName: string;
}

interface Enemy {
    name: string;
    hp: number;
    attack: number;
    defense: number;
    goldReward: number;
    icon: string;
    lootTable: { itemId: number; dropChance: number }[];
}

interface Inventory {
    [itemId: number]: number;
}

interface DamagePopup {
    id: number;
    damage: number;
    target: 'player' | 'enemy';
}


// --- CONSTANTS ---
const SHOP_WEAPONS: Item[] = [
    { id: 1, type: ItemType.WEAPON, name: '플라즈마 소총', damage: 30, accuracy: 80, fireRate: 60, price: 100 },
    { id: 2, type: ItemType.WEAPON, name: '이온 블래스터', damage: 50, accuracy: 65, fireRate: 40, price: 150 },
    { id: 3, type: ItemType.WEAPON, name: '레일건', damage: 80, accuracy: 90, fireRate: 20, price: 250 },
    { id: 9, type: ItemType.WEAPON, name: '가우스 라이플', damage: 65, accuracy: 85, fireRate: 30, price: 200 },
    { id: 10, type: ItemType.WEAPON, name: '레이저 SMG', damage: 20, accuracy: 70, fireRate: 90, price: 180 },
    { id: 11, type: ItemType.WEAPON, name: '중력자 캐논', damage: 120, accuracy: 60, fireRate: 10, price: 400 },
];
const SHOP_ARMOR: Item[] = [
    { id: 12, type: ItemType.ARMOR, name: '경량 폴리머 조끼', defense: 15, price: 50 },
    { id: 4, type: ItemType.ARMOR, name: '티타늄 플레이트', defense: 30, price: 80 },
    { id: 5, type: ItemType.ARMOR, name: '에너지 쉴드', defense: 20, price: 120 }, // 에너지 쉴드는 방어력이 낮지만 다른 효과가 있을 수 있다는 설정 암시
    { id: 13, type: ItemType.ARMOR, name: '반사 코팅 아머', defense: 40, price: 160 },
    { id: 6, type: ItemType.ARMOR, name: '나노 복합 아머', defense: 50, price: 200 },
    { id: 14, type: ItemType.ARMOR, name: '양자 역장 생성기', defense: 70, price: 350 },
];
const SHOP_CONSUMABLES: Item[] = [
    { id: 7, type: ItemType.CONSUMABLE, name: '구급상자', effect: { type: 'HEAL', amount: 50 }, price: 30 },
    { id: 8, type: ItemType.CONSUMABLE, name: '전투 자극제', effect: { type: 'ATTACK_UP', amount: 15, duration: 3 }, price: 50 },
    { id: 15, type: ItemType.CONSUMABLE, name: '나노 방어막 주사기', effect: { type: 'DEFENSE_UP', amount: 20, duration: 3 }, price: 60 },
    { id: 16, type: ItemType.CONSUMABLE, name: '재생 혈청', effect: { type: 'REGEN', amount: 15, duration: 3 }, price: 70 },
];

const ALL_ITEMS = [...SHOP_WEAPONS, ...SHOP_ARMOR, ...SHOP_CONSUMABLES].reduce((map, item) => {
    map.set(item.id, item);
    return map;
}, new Map<number, Item>());


const VILLAIN_TYPES: Enemy[] = [
    { name: '해골 병사', hp: 80, attack: 20, defense: 5, goldReward: 20, icon: '💀', lootTable: [{ itemId: 4, dropChance: 0.2 }] }, // 티타늄 플레이트
    { name: '고블린 정찰병', hp: 60, attack: 25, defense: 2, goldReward: 15, icon: '👺', lootTable: [{ itemId: 7, dropChance: 0.5 }] }, // 구급상자
    { name: '화염 드래곤', hp: 200, attack: 35, defense: 15, goldReward: 100, icon: '🐲', lootTable: [{ itemId: 3, dropChance: 0.1 }, { itemId: 6, dropChance: 0.15 }] }, // 레일건, 나노 복합 아머
    { name: '사이버네틱 암살자', hp: 100, attack: 30, defense: 10, goldReward: 50, icon: '🤖', lootTable: [{ itemId: 8, dropChance: 0.3 }] }, // 전투 자극제
    { name: '뮤턴트 괴수', hp: 150, attack: 25, defense: 20, goldReward: 70, icon: '🦍', lootTable: [{ itemId: 5, dropChance: 0.25 }] }, // 에너지 쉴드
    { name: 'AI 드론 편대', hp: 70, attack: 15, defense: 10, goldReward: 25, icon: '🛸', lootTable: [{ itemId: 7, dropChance: 0.4 }] }, // 구급상자
];

const INITIAL_PLAYER_STATS: PlayerStats = { hp: 100, attack: 10, defense: 5, gold: 200 };
const MAX_HP = 100;

// --- HELPERS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- COMPONENTS ---
const StatBar = ({ value, maxValue, color }: { value: number, maxValue: number, color: string }) => {
    const percentage = (value / maxValue) * 100;
    const gradient = `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`;
    return (
        <div className="stat-bar-container">
            <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${percentage}%`, background: gradient }}>
                   {`${Math.max(0, Math.round(value))} / ${maxValue}`}
                </div>
            </div>
        </div>
    );
};

const ItemCard = ({ item, onSelect, isSelected }: { item: Item, onSelect: (item: Item) => void, isSelected: boolean }) => (
    <div className={`item-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(item)}>
        <span className="item-tag">{item.type}</span>
        <h4>{item.name}</h4>
        <p>{item.price} G</p>
    </div>
);

const PlayerStatsComponent = ({ stats, equippedWeapon, equippedArmor, playerName, onPlayerNameChange }: { stats: PlayerStats, equippedWeapon: Item | null, equippedArmor: Item | null, playerName: string, onPlayerNameChange: (newName: string) => void }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(playerName);

    const handleNameSave = () => {
        if (nameInput.trim()) {
            onPlayerNameChange(nameInput.trim());
            setIsEditingName(false);
        }
    };
    
    const totalStats = useMemo(() => {
        let totalAttack = stats.attack;
        let totalDefense = stats.defense;
        if (equippedWeapon?.damage) {
            totalAttack += equippedWeapon.damage; 
        }
        if (equippedArmor?.defense) {
            totalDefense += equippedArmor.defense;
        }
        return { ...stats, attack: Math.round(totalAttack), defense: Math.round(totalDefense) };
    }, [stats, equippedWeapon, equippedArmor]);

    return (
        <div className="card player-stats">
            <h2>플레이어 정보</h2>
             <div className="player-name-section">
                {isEditingName ? (
                    <>
                        <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="새 이름 입력" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}/>
                        <button onClick={handleNameSave}>저장</button>
                    </>
                ) : (
                    <>
                        <h3>{playerName}</h3>
                        <button onClick={() => setIsEditingName(true)}>이름 변경</button>
                    </>
                )}
            </div>
            <p>💰 골드: {totalStats.gold}</p>
            <StatBar value={totalStats.hp} maxValue={MAX_HP} color="#4caf50" />
            <p>⚔️ 공격력: {totalStats.attack} ({stats.attack}{equippedWeapon ? ` + ${equippedWeapon.damage}` : ''})</p>
            <p>🛡️ 방어력: {totalStats.defense} ({stats.defense}{equippedArmor ? ` + ${equippedArmor.defense}` : ''})</p>
            <p>장착 무기: {equippedWeapon ? equippedWeapon.name : '없음'}</p>
            <p>장착 방어구: {equippedArmor ? equippedArmor.name : '없음'}</p>
        </div>
    );
};

const ItemDetails = ({ item, onBuy, playerGold }: { item: Item | null, onBuy: (item: Item) => void, playerGold: number }) => {
    if (!item) return <div className="card item-details"><h3>아이템을 선택하세요</h3></div>;
    
    const canAfford = playerGold >= item.price;
    const effectText = (effect: Item['effect']) => {
        if(!effect) return null;
        switch(effect.type){
            case 'HEAL': return `HP ${effect.amount} 회복`;
            case 'ATTACK_UP': return `공격력 ${effect.amount} 증가 (${effect.duration}턴)`;
            case 'DEFENSE_UP': return `방어력 ${effect.amount} 증가 (${effect.duration}턴)`;
            case 'REGEN': return `턴당 HP ${effect.amount} 회복 (${effect.duration}턴)`;
            default: return '알 수 없는 효과';
        }
    }

    return (
        <div className="card item-details">
            <h3>{item.name} <span className="item-tag">{item.type}</span></h3>
            <p>가격: {item.price} G</p>
            {item.damage && <p>데미지: {item.damage}</p>}
            {item.accuracy && <p>명중률: {item.accuracy}%</p>}
            {item.fireRate && <p>연사속도: {item.fireRate}</p>}
            {item.defense && <p>방어력: {item.defense}</p>}
            {item.effect && <p>효과: {effectText(item.effect)}</p>}
            <button onClick={() => onBuy(item)} disabled={!canAfford}>
                {canAfford ? '구매' : '골드 부족'}
            </button>
        </div>
    );
};

const Inventory = ({ inventory, onEquip, onUse, onSell, equippedWeaponId, equippedArmorId }: { inventory: Inventory, onEquip: (item: Item) => void, onUse: (item: Item) => void, onSell: (item: Item) => void, equippedWeaponId: number | null, equippedArmorId: number | null }) => {
    const inventoryItems = Object.keys(inventory).map(id => ALL_ITEMS.get(parseInt(id))).filter(Boolean) as Item[];

    return (
        <div className="card">
            <h2>인벤토리</h2>
            <div className="inventory-list">
                {inventoryItems.length === 0 && <p>인벤토리가 비어있습니다.</p>}
                {inventoryItems.map(item => {
                    const isEquipped = item.id === equippedWeaponId || item.id === equippedArmorId;
                    return (
                        <div key={item.id} className="inventory-item">
                            <span>{item.name} (x{inventory[item.id]}) {isEquipped ? '✅' : ''}</span>
                            <div>
                                {item.type === ItemType.WEAPON && <button onClick={() => onEquip(item)}>{isEquipped ? '해제' : '장착'}</button>}
                                {item.type === ItemType.ARMOR && <button onClick={() => onEquip(item)}>{isEquipped ? '해제' : '장착'}</button>}
                                {item.type === ItemType.CONSUMABLE && <button onClick={() => onUse(item)}>사용</button>}
                                <button onClick={() => onSell(item)}>판매 ({Math.floor(item.price / 2)} G)</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BattleSimulator = ({ playerStats, equippedWeapon, equippedArmor, inventory, onBattleEnd, onUseItem, playerName }: { playerStats: PlayerStats, equippedWeapon: Item | null, equippedArmor: Item | null, inventory: Inventory, onBattleEnd: (result: { victory: boolean, gold: number, loot: Item[] }) => void, onUseItem: (item: Item) => void, playerName: string }) => {
    const [enemy, setEnemy] = useState<Enemy | null>(null);
    const [playerCurrentHP, setPlayerCurrentHP] = useState(playerStats.hp);
    const [enemyCurrentHP, setEnemyCurrentHP] = useState(0);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [isBattleOver, setIsBattleOver] = useState(false);
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null);
    
    // Animation states
    const [isAttacking, setIsAttacking] = useState<'player' | 'enemy' | null>(null);
    const [isHit, setIsHit] = useState<'player' | 'enemy' | null>(null);
    const [abilityEffect, setAbilityEffect] = useState<{ target: 'player' | 'enemy', type: string } | null>(null);
    const [screenShake, setScreenShake] = useState(false);

    const logRef = useRef<HTMLDivElement>(null);

    const totalPlayerStats = useMemo(() => {
        const attackEffect = activeEffects.find(e => e.type === 'ATTACK_UP');
        const defenseEffect = activeEffects.find(e => e.type === 'DEFENSE_UP');
        return {
            hp: playerStats.hp,
            attack: playerStats.attack + (equippedWeapon?.damage ?? 0) + (attackEffect?.amount ?? 0),
            defense: playerStats.defense + (equippedArmor?.defense ?? 0) + (defenseEffect?.amount ?? 0),
        };
    }, [playerStats, equippedWeapon, equippedArmor, activeEffects]);

    const playerAuraType = useMemo(() => {
        if (activeEffects.find(e => e.type === 'ATTACK_UP')) return 'ATTACK_UP';
        if (activeEffects.find(e => e.type === 'DEFENSE_UP')) return 'DEFENSE_UP';
        if (activeEffects.find(e => e.type === 'REGEN')) return 'REGEN';
        return null;
    }, [activeEffects]);

    const playerAuraIsBlinking = useMemo(() => {
        return activeEffects.some(e => e.type === playerAuraType && e.duration === 1);
    }, [activeEffects, playerAuraType]);

    useEffect(() => {
        const newEnemy = { ...VILLAIN_TYPES[Math.floor(Math.random() * VILLAIN_TYPES.length)] };
        setEnemy(newEnemy);
        setEnemyCurrentHP(newEnemy.hp);
        setPlayerCurrentHP(playerStats.hp);
        setIsBattleOver(false);
        setBattleResult(null);
        setBattleLog([`<system-message>야생의 ${newEnemy.name}이(가) 나타났다!</system-message>`]);
    }, [playerStats.hp]);
    
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [battleLog]);

    const addLog = (message: string) => {
        setBattleLog(prev => [...prev, message]);
    };

    const showDamagePopup = (damage: number, target: 'player' | 'enemy') => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, damage, target }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 800);
    };

    const endTurn = (turnJustEnded: 'player' | 'enemy') => {
        let regeneratedHP = 0;
        const nextEffects = activeEffects.map(effect => {
             if (effect.type === 'REGEN') {
                regeneratedHP += effect.amount;
             }
             return { ...effect, duration: effect.duration - 1 };
        }).filter(effect => {
            if (effect.duration <= 0) {
                addLog(`<effect-message>${effect.itemName}의 효과가 사라졌다.</effect-message>`);
                return false;
            }
            return true;
        });
        
        if (regeneratedHP > 0) {
            addLog(`<effect-message>재생 효과로 HP를 ${regeneratedHP} 회복했다.</effect-message>`);
            setPlayerCurrentHP(hp => Math.min(MAX_HP, hp + regeneratedHP));
        }

        setActiveEffects(nextEffects);

        if (turnJustEnded === 'player' && !isBattleOver) {
            setTimeout(handleEnemyTurn, 1000);
        } else {
            setIsPlayerTurn(true);
        }
    };

    const handlePlayerAttack = async () => {
        if (!isPlayerTurn || isBattleOver || !enemy) return;
        setIsPlayerTurn(false);

        let newEnemyHP = enemyCurrentHP;
        let didHit = false;
        const accuracy = equippedWeapon?.accuracy ?? 75;
        
        if (Math.random() * 100 > accuracy) {
            addLog(`<player-turn>${playerName}의 공격이 빗나갔다!</player-turn>`);
        } else {
            didHit = true;
            const damage = Math.max(1, Math.round(totalPlayerStats.attack * (1 - enemy.defense / 100)));
            newEnemyHP = enemyCurrentHP - damage;
            addLog(`<player-turn>${playerName}이(가) ${enemy.name}에게 ${damage}의 피해를 입혔다!</player-turn>`);
            setEnemyCurrentHP(newEnemyHP);
            showDamagePopup(damage, 'enemy');
        }

        setIsAttacking('player');
        await delay(150);
        if (didHit) {
            setScreenShake(true);
            setIsHit('enemy');
        }
        await delay(250);
        setIsAttacking(null);
        setIsHit(null);
        setScreenShake(false);

        if (newEnemyHP <= 0) {
            handleBattleEnd(true);
        } else {
            await delay(600);
            endTurn('player');
        }
    };
    
    const handleUseConsumable = async (item: Item) => {
        if (!isPlayerTurn || isBattleOver || !item.effect) return;
        setIsPlayerTurn(false);
        onUseItem(item);
        
        const { type, amount, duration } = item.effect;
        addLog(`<player-turn>${playerName}이(가) ${item.name}을(를) 사용했다.</player-turn>`);
        setAbilityEffect({ target: 'player', type });

        switch(type) {
            case 'HEAL':
                const newHp = Math.min(MAX_HP, playerCurrentHP + amount);
                setPlayerCurrentHP(newHp);
                addLog(`<effect-message>HP를 ${amount} 회복했다!</effect-message>`);
                break;
            case 'ATTACK_UP':
            case 'DEFENSE_UP':
            case 'REGEN':
                setActiveEffects(prev => {
                    const existingEffectIndex = prev.findIndex(e => e.type === type);
                    if(existingEffectIndex > -1){
                        const newEffects = [...prev];
                        newEffects[existingEffectIndex] = { ...newEffects[existingEffectIndex], duration: duration! };
                        return newEffects;
                    }
                    return [...prev, { type, amount, duration: duration!, itemName: item.name }];
                });
                addLog(`<effect-message>${item.name}의 효과가 발동했다! (${duration}턴 지속)</effect-message>`);
                break;
        }
        await delay(1200);
        setAbilityEffect(null);
        endTurn('player');
    };

    const handleEnemyTurn = async () => {
        if (isBattleOver || !enemy) return;

        const damage = Math.max(1, Math.round(enemy.attack * (1 - totalPlayerStats.defense / 100)));
        const newPlayerHP = playerCurrentHP - damage;

        addLog(`<enemy-turn>${enemy.name}이(가) ${playerName}에게 ${damage}의 피해를 입혔다!</enemy-turn>`);
        setPlayerCurrentHP(newPlayerHP);
        showDamagePopup(damage, 'player');
        
        setIsAttacking('enemy');
        await delay(150);
        setScreenShake(true);
        setIsHit('player');
        await delay(250);
        setIsAttacking(null);
        setIsHit(null);
        setScreenShake(false);
        
        if (newPlayerHP <= 0) {
            handleBattleEnd(false);
        } else {
            await delay(600);
            endTurn('enemy');
        }
    };
    
    const handleBattleEnd = (victory: boolean) => {
        setIsBattleOver(true);
        setBattleResult(victory ? 'victory' : 'defeat');
        let goldReward = 0;
        let loot: Item[] = [];
        if (victory) {
            goldReward = enemy?.goldReward ?? 0;
            enemy?.lootTable.forEach(item => {
                if (Math.random() < item.dropChance) {
                    const droppedItem = ALL_ITEMS.get(item.itemId);
                    if (droppedItem) loot.push(droppedItem);
                }
            });
            addLog(`<system-message>승리했다! ${goldReward} 골드와 아이템을 획득했다!</system-message>`);
            loot.forEach(item => addLog(`<system-message>획득: ${item.name}</system-message>`));
        } else {
            addLog('<system-message>패배했다...</system-message>');
        }
        
        setTimeout(() => onBattleEnd({ victory, gold: goldReward, loot }), 3000);
    };

    if (!enemy) return <div>로딩 중...</div>;

    const consumableItems = Object.keys(inventory)
        .map(id => ALL_ITEMS.get(parseInt(id)))
        .filter(item => item?.type === ItemType.CONSUMABLE) as Item[];

    return (
        <div className={`card battle-simulator ${screenShake ? 'screen-shake' : ''}`}>
            <h2>전투</h2>
             {battleResult && <div className={`battle-result-banner ${battleResult}`}>{battleResult === 'victory' ? '승리' : '패배'}</div>}
            <div className="combat-screen">
                <div className={`character-container player-side ${isAttacking === 'player' ? 'attacking' : ''} ${isHit === 'player' ? 'hit' : ''} ${battleResult === 'victory' ? 'victory' : ''} ${battleResult === 'defeat' ? 'defeat' : ''}`}>
                    {abilityEffect?.target === 'player' && (
                        <div className={`ability-effect ${abilityEffect.type}`}>
                            {abilityEffect.type === 'HEAL' && <div className="heal-particles"><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span></div>}
                        </div>
                    )}
                    <h4>{playerName}</h4>
                    <div className={`character player-char ${playerAuraType ? `buff-aura ${playerAuraType}_aura ${playerAuraIsBlinking ? 'blinking' : ''}` : ''}`}>💻</div>
                    <StatBar value={playerCurrentHP} maxValue={MAX_HP} color="#4caf50" />
                    {damagePopups.filter(p => p.target === 'player').map(p => <div key={p.id} className="damage-popup">{p.damage}</div>)}
                </div>
                <span>VS</span>
                <div className={`character-container enemy-side ${isAttacking === 'enemy' ? 'attacking' : ''} ${isHit === 'enemy' ? 'hit' : ''} ${battleResult === 'defeat' ? 'victory' : ''} ${battleResult === 'victory' ? 'defeat' : ''}`}>
                    <h4>{enemy.name}</h4>
                    <div className="character enemy-char">{enemy.icon}</div>
                    <StatBar value={enemyCurrentHP} maxValue={enemy.hp} color="#f44336" />
                    {damagePopups.filter(p => p.target === 'enemy').map(p => <div key={p.id} className="damage-popup">{p.damage}</div>)}
                </div>
            </div>

            <div className="active-effects">
                 {activeEffects.map((e, i) => <span key={i} className={`effect-tag ${e.duration === 1 ? 'blinking' : ''}`}>{e.itemName}({e.duration}) </span>)}
            </div>

            <div className="battle-actions">
                <button onClick={handlePlayerAttack} disabled={!isPlayerTurn || isBattleOver}>공격</button>
                {consumableItems.map(item => (
                    <button key={item.id} onClick={() => handleUseConsumable(item)} disabled={!isPlayerTurn || isBattleOver}>
                        {item.name} ({inventory[item.id]})
                    </button>
                ))}
            </div>

            <div className="battle-log" ref={logRef} dangerouslySetInnerHTML={{ __html: battleLog.join('') }}></div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [currentView, setCurrentView] = useState(View.SHOP);
    const [playerStats, setPlayerStats] = useState<PlayerStats>(INITIAL_PLAYER_STATS);
    const [playerName, setPlayerName] = useState("사이버 전사");
    const [inventory, setInventory] = useState<Inventory>({ 7: 2 }); // 시작 시 구급상자 2개
    const [equippedWeapon, setEquippedWeapon] = useState<Item | null>(null);
    const [equippedArmor, setEquippedArmor] = useState<Item | null>(null);
    const [selectedShopItem, setSelectedShopItem] = useState<Item | null>(null);
    const [shopTab, setShopTab] = useState(ItemType.WEAPON);
    
    const handleBuyItem = useCallback((item: Item) => {
        if (playerStats.gold >= item.price) {
            setPlayerStats(prev => ({ ...prev, gold: prev.gold - item.price }));
            setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
        }
    }, [playerStats.gold]);

    const handleSellItem = useCallback((item: Item) => {
        const sellPrice = Math.floor(item.price / 2);
        setPlayerStats(prev => ({ ...prev, gold: prev.gold + sellPrice }));
        setInventory(prev => {
            const newInventory = { ...prev };
            newInventory[item.id] -= 1;
            if (newInventory[item.id] <= 0) {
                delete newInventory[item.id];
            }
            return newInventory;
        });

        // 만약 판매한 아이템이 장착된 아이템이라면 장착 해제
        if (equippedWeapon?.id === item.id) setEquippedWeapon(null);
        if (equippedArmor?.id === item.id) setEquippedArmor(null);
    }, [equippedWeapon, equippedArmor]);

    const handleEquipItem = useCallback((item: Item) => {
        if (item.type === ItemType.WEAPON) {
            setEquippedWeapon(prev => prev?.id === item.id ? null : item);
        } else if (item.type === ItemType.ARMOR) {
            setEquippedArmor(prev => prev?.id === item.id ? null : item);
        }
    }, []);

    const handleUseItem = useCallback((item: Item) => {
        if (item.type === ItemType.CONSUMABLE) {
             // 비전투 시 체력 회복 효과만 적용
            if (currentView !== View.BATTLE && item.effect?.type === 'HEAL') {
                setPlayerStats(prev => ({...prev, hp: Math.min(MAX_HP, prev.hp + item.effect!.amount)}));
            }
             
            setInventory(prev => {
                const newInventory = { ...prev };
                newInventory[item.id] -= 1;
                if (newInventory[item.id] <= 0) {
                    delete newInventory[item.id];
                }
                return newInventory;
            });
        }
    }, [currentView]);

    const handleBattleEnd = useCallback(({ victory, gold, loot }: { victory: boolean, gold: number, loot: Item[] }) => {
        if (victory) {
            setPlayerStats(prev => ({
                ...prev,
                gold: prev.gold + gold,
            }));
            setInventory(prev => {
                const newInventory = { ...prev };
                loot.forEach(item => {
                    newInventory[item.id] = (newInventory[item.id] || 0) + 1;
                });
                return newInventory;
            });
        }
        // 전투 후 체력만 최대로 회복
        setPlayerStats(prev => ({ ...prev, hp: MAX_HP }));
        setCurrentView(View.PLAYER);
    }, []);
    
    const handlePlayerNameChange = (newName: string) => {
        setPlayerName(newName);
    };

    const shopItems = useMemo(() => {
        switch (shopTab) {
            case ItemType.WEAPON: return SHOP_WEAPONS;
            case ItemType.ARMOR: return SHOP_ARMOR;
            case ItemType.CONSUMABLE: return SHOP_CONSUMABLES;
            default: return [];
        }
    }, [shopTab]);

    const viewIndex = useMemo(() => {
        if (currentView === View.SHOP) return 0;
        if (currentView === View.PLAYER) return 1;
        if (currentView === View.BATTLE) return 2;
        return 0;
    }, [currentView]);

    return (
        <>
            <h1>RPG 상점 & 전투 시뮬레이터</h1>
            <nav className="main-nav">
                <button onClick={() => setCurrentView(View.SHOP)} className={currentView === View.SHOP ? 'active' : ''}>상점</button>
                <button onClick={() => setCurrentView(View.PLAYER)} className={currentView === View.PLAYER ? 'active' : ''}>플레이어</button>
                <button onClick={() => setCurrentView(View.BATTLE)} className={currentView === View.BATTLE ? 'active' : ''}>전투 시작</button>
            </nav>

            <div className="carousel-viewport">
                <div className="carousel-slider" style={{ transform: `translateX(-${viewIndex * 100}%)` }}>
                    {/* Shop View */}
                    <div className="carousel-slide">
                        <div className="shop-slide-container">
                            <div>
                                <div className="card">
                                    <div className="shop-tabs">
                                        <button onClick={() => setShopTab(ItemType.WEAPON)} className={shopTab === ItemType.WEAPON ? 'active' : ''}>무기</button>
                                        <button onClick={() => setShopTab(ItemType.ARMOR)} className={shopTab === ItemType.ARMOR ? 'active' : ''}>방어구</button>
                                        <button onClick={() => setShopTab(ItemType.CONSUMABLE)} className={shopTab === ItemType.CONSUMABLE ? 'active' : ''}>소모품</button>
                                    </div>
                                    <div className="shop-grid">
                                        {shopItems.map(item => <ItemCard key={item.id} item={item} onSelect={setSelectedShopItem} isSelected={selectedShopItem?.id === item.id} />)}
                                    </div>
                                </div>
                            </div>
                            <ItemDetails item={selectedShopItem} onBuy={handleBuyItem} playerGold={playerStats.gold} />
                        </div>
                    </div>

                    {/* Player View */}
                    <div className="carousel-slide">
                         <div className="player-slide-container">
                             <PlayerStatsComponent stats={playerStats} equippedWeapon={equippedWeapon} equippedArmor={equippedArmor} playerName={playerName} onPlayerNameChange={handlePlayerNameChange} />
                             <Inventory inventory={inventory} onEquip={handleEquipItem} onUse={handleUseItem} onSell={handleSellItem} equippedWeaponId={equippedWeapon?.id || null} equippedArmorId={equippedArmor?.id || null}/>
                         </div>
                    </div>
                    
                    {/* Battle View */}
                    <div className="carousel-slide">
                       {currentView === View.BATTLE && (
                           <BattleSimulator 
                                playerStats={playerStats} 
                                equippedWeapon={equippedWeapon} 
                                equippedArmor={equippedArmor}
                                inventory={inventory}
                                onBattleEnd={handleBattleEnd}
                                onUseItem={handleUseItem}
                                playerName={playerName}
                            />
                       )}
                    </div>
                </div>
            </div>
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);