import React, { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES & CONSTANTS ---
const ItemType = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    CONSUMABLE: 'Consumable',
    MATERIAL: 'Material',
};

const View = {
    TOWN: 'TOWN',
    SHOP: 'SHOP',
    PLAYER: 'PLAYER',
    BATTLE: 'BATTLE',
    RUINS: 'RUINS',
    BLACKSMITH: 'BLACKSMITH',
    QUEST_BOARD: 'QUEST_BOARD',
    DUNGEON: 'DUNGEON',
    GACHA_SHRINE: 'GACHA_SHRINE',
    TOWN_HALL: 'TOWN_HALL',
    TROPHY_ROAD: 'TROPHY_ROAD',
    PETS: 'PETS',
    CLASS_SELECTION: 'CLASS_SELECTION',
    DUNGEON_BATTLE: 'DUNGEON_BATTLE',
};

const ItemGrade = {
    COMMON: 'COMMON',
    UNCOMMON: 'UNCOMMON',
    RARE: 'RARE',
    EPIC: 'EPIC',
    LEGENDARY: 'LEGENDARY'
};

const ItemGradeInfo: Record<string, { name: string; color: string; class: string; order: number; }> = {
    [ItemGrade.COMMON]: { name: '일반', color: '#ffffff', class: 'grade-common', order: 1 },
    [ItemGrade.UNCOMMON]: { name: '고급', color: '#1eff00', class: 'grade-uncommon', order: 2 },
    [ItemGrade.RARE]: { name: '희귀', color: '#0070dd', class: 'grade-rare', order: 3 },
    [ItemGrade.EPIC]: { name: '영웅', color: '#a335ee', class: 'grade-epic', order: 4 },
    [ItemGrade.LEGENDARY]: { name: '전설', color: '#ff8000', class: 'grade-legendary', order: 5 }
};

const PlayerClasses = {
    Warrior: { name: '전사', description: '강인한 체력과 방어력을 가집니다. (최대 HP +20, 방어력 +5)', bonuses: { maxHp: 20, defense: 5, attack: 0 } },
    Archer: { name: '궁수', description: '높은 공격력과 치명타 확률을 자랑합니다. (공격력 +5, 치명타 확률 +5%)', bonuses: { attack: 5, critChance: 0.05, maxHp: 0, defense: 0 } },
};

const UltimateSkills = {
    Adventurer: { name: '파워 스트라이크', description: '적에게 250%의 피해를 입힙니다.' },
    Warrior: { name: '분쇄의 일격', description: '적에게 300%의 피해를 입히고 50% 확률로 1턴 동안 기절시킵니다.' },
    Archer: { name: '저격', description: '반드시 치명타로 적중하는 강력한 화살을 발사합니다. (기본 치명타 피해량의 200%)' }
};

const PET_GACHA_COST = 500;
const ITEM_GACHA_COST = 300;


// --- INTERFACES ---
interface Item {
    id: number;
    type: string;
    name: string;
    price: number;
    grade: string;
    enhancementLevel?: number;
    damage?: number;
    accuracy?: number;
    critChance?: number;
    critDamageMultiplier?: number;
    procChance?: number;
    procDamage?: number;
    defense?: number;
    weaponType?: 'Melee' | 'Gun' | 'Bow' | 'Staff';
    effect?: {
        type: string;
        amount: number;
        duration?: number;
    };
    description: string;
}

interface Pet {
    id: number;
    name: string;
    type: 'Griffin' | 'Turtle' | 'Dragon';
    grade: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    attackBonus: number;
    defenseBonus: number;
    skillName: string;
    skillDescription: string;
    skillProcChance: number; 
    skillEffect?: {
        type: 'damage' | 'heal' | 'defense_buff';
        amount?: number;
        duration?: number;
    };
}

interface PlayerStats {
    playerName: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    maxHp: number;
    hp: number;
    attack: number;
    defense: number;
    gold: number;
    craftingLevel: number;
    craftingXp: number;
    craftingXpToNextLevel: number;
    trophies: number;
    claimedTrophyRewards: number[];
    inventory: (Item & { quantity: number })[];
    equipment: {
        weapon: Item | null;
        armor: Item | null;
    };
    playerClass: keyof typeof PlayerClasses | null;
    townLevel: number;
    townXp: number;
    activeQuests: Quest[];
    pets: Pet[];
    activePetId: number | null;
}

interface Material {
    id: number;
    name: string;
    description: string;
}

interface Recipe {
    id: number;
    name: string;
    result: Item;
    materials: { materialId: number; quantity: number }[];
    requiredCraftingLevel: number;
}

interface Quest {
    id: number;
    title: string;
    description: string;
    type: 'DEFEAT_MONSTER' | 'COLLECT_ITEM' | 'CRAFT_ITEM';
    targetId: number; // monster or item id
    targetQuantity: number;
    currentProgress: number;
    rewards: {
        xp: number;
        gold: number;
        items?: { itemId: number; quantity: number }[];
    };
    isCompleted: boolean;
}

interface Monster {
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    xp: number;
    gold: number;
    drops?: { itemId: number; chance: number; quantity: number }[];
    emoji: string;
    statusEffects?: {
        stun: number;
    };
}

interface Dungeon {
    id: number;
    name: string;
    description: string;
    difficulty: number;
    stages: number;
    monsters: number[]; // monster IDs
    rewards: {
        xp: number;
        gold: number;
        items: { itemId: number; quantity: number }[];
    };
}

interface DamagePopupInfo {
    id: number;
    amount: string;
    isCrit: boolean;
    target: 'player' | 'enemy';
}

interface GachaResult {
    type: 'item' | 'pet';
    item?: Item;
    pet?: Pet;
}

const allPets: Omit<Pet, 'level' | 'xp' | 'xpToNextLevel'>[] = [
    { id: 1, name: '그리핀 주니어', type: 'Griffin', grade: ItemGrade.RARE, attackBonus: 5, defenseBonus: 0, skillName: '할퀴기', skillDescription: '15% 확률로 추가 피해를 입힙니다.', skillProcChance: 0.15, skillEffect: { type: 'damage', amount: 10 } },
    { id: 2, name: '돌북이', type: 'Turtle', grade: ItemGrade.RARE, attackBonus: 0, defenseBonus: 8, skillName: '단단해지기', skillDescription: '전투 시작 시 방어력이 10% 증가합니다.', skillProcChance: 1.0 }, // Always active at start
    { id: 3, name: '아기용', type: 'Dragon', grade: ItemGrade.EPIC, attackBonus: 10, defenseBonus: 5, skillName: '작은 불씨', skillDescription: '20% 확률로 강력한 화염 피해를 입힙니다.', skillProcChance: 0.20, skillEffect: { type: 'damage', amount: 25 } },
];


// --- DATABASE ---
const allItems: Item[] = [
    // --- 기존 아이템 ---
    { id: 1, type: ItemType.WEAPON, name: '나무 몽둥이', price: 10, grade: ItemGrade.COMMON, damage: 3, accuracy: 0.8, description: '흔한 나무 몽둥이입니다.' },
    { id: 2, type: ItemType.WEAPON, name: '낡은 검', price: 50, grade: ItemGrade.COMMON, damage: 5, accuracy: 0.9, description: '가장 기본적인 검입니다. 없는 것보단 낫습니다.' },
    { id: 3, type: ItemType.WEAPON, name: '강철 검', price: 200, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, critChance: 0.05, critDamageMultiplier: 1.5, description: '잘 벼려진 강철 검입니다.' },
    { id: 4, type: ItemType.ARMOR, name: '가죽 갑옷', price: 120, grade: ItemGrade.UNCOMMON, defense: 5, description: '질긴 가죽으로 만든 갑옷입니다.' },
    { id: 5, type: ItemType.CONSUMABLE, name: '하급 체력 물약', price: 20, grade: ItemGrade.COMMON, effect: { type: 'heal', amount: 20 }, description: 'HP를 20 회복합니다.' },
    { id: 6, type: ItemType.MATERIAL, name: '철광석', price: 10, grade: ItemGrade.COMMON, description: '강철을 만드는 데 사용되는 기본적인 광물입니다.' },
    { id: 7, type: ItemType.MATERIAL, name: '가죽', price: 8, grade: ItemGrade.COMMON, description: '동물에게서 얻을 수 있는 질긴 가죽입니다.' },
    { id: 8, type: ItemType.WEAPON, name: '지휘관의 창', price: 1000, grade: ItemGrade.EPIC, damage: 25, accuracy: 0.95, critChance: 0.1, critDamageMultiplier: 1.8, procChance: 0.1, procDamage: 10, description: '전장을 지휘하는 지휘관의 창. 10% 확률로 추가 피해를 입힙니다.' },
    { id: 9, type: ItemType.ARMOR, name: '강철 갑옷', price: 650, grade: ItemGrade.RARE, defense: 15, description: '견고한 강철로 만들어진 갑옷입니다.' },
    { id: 10, type: ItemType.WEAPON, name: '엘프의 활', price: 1200, grade: ItemGrade.EPIC, weaponType: 'Bow', damage: 22, accuracy: 1.1, critChance: 0.15, critDamageMultiplier: 2.0, description: '신비로운 힘이 깃든 엘프의 활. 명중률이 매우 높습니다.' },
    { id: 11, type: ItemType.WEAPON, name: '천공의 분노', price: 5000, grade: ItemGrade.LEGENDARY, damage: 50, accuracy: 0.9, critChance: 0.2, critDamageMultiplier: 2.5, description: '하늘의 분노를 담은 전설적인 검입니다.' },
    { id: 12, type: ItemType.MATERIAL, name: '마력의 돌', price: 100, grade: ItemGrade.RARE, description: '신비한 마력이 깃든 돌. 강화에 사용됩니다.' },

    // --- 신규 무기 ---
    // Common
    { id: 13, type: ItemType.WEAPON, name: '단검', price: 40, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.95, critChance: 0.05, critDamageMultiplier: 1.6, description: '빠른 공격이 가능한 작은 검입니다.' },
    { id: 14, type: ItemType.WEAPON, name: '글라디우스', price: 60, grade: ItemGrade.COMMON, damage: 6, accuracy: 0.9, description: '로마 병사들이 사용하던 짧은 검입니다.' },
    { id: 15, type: ItemType.WEAPON, name: '손도끼', price: 45, grade: ItemGrade.COMMON, damage: 5, accuracy: 0.85, description: '한 손으로 다루기 쉬운 도끼입니다.' },
    { id: 16, type: ItemType.WEAPON, name: '쿼터스태프', price: 35, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.9, description: '단단한 나무로 만든 긴 지팡이입니다.' },
    { id: 17, type: ItemType.WEAPON, name: '망치', price: 15, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.75, description: '평범한 망치입니다.' },

    // Uncommon
    { id: 18, type: ItemType.WEAPON, name: '아이언 액스', price: 220, grade: ItemGrade.UNCOMMON, damage: 12, accuracy: 0.85, description: '묵직한 철제 도끼입니다.' },
    { id: 19, type: ItemType.WEAPON, name: '숏보우', price: 180, grade: ItemGrade.UNCOMMON, weaponType: 'Bow', damage: 8, accuracy: 1.0, critChance: 0.1, critDamageMultiplier: 1.6, description: '다루기 쉬운 짧은 활입니다.' },
    { id: 20, type: ItemType.WEAPON, name: '롱소드', price: 250, grade: ItemGrade.UNCOMMON, damage: 11, accuracy: 0.9, critChance: 0.05, critDamageMultiplier: 1.5, description: '균형 잡힌 장검입니다.' },
    { id: 21, type: ItemType.WEAPON, name: '스피어', price: 210, grade: ItemGrade.UNCOMMON, damage: 9, accuracy: 0.95, description: '긴 사정거리를 가진 창입니다.' },
    { id: 22, type: ItemType.WEAPON, name: '시미터', price: 240, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, critChance: 0.08, critDamageMultiplier: 1.6, description: '아름다운 곡선 형태의 검입니다.' },
    { id: 23, type: ItemType.WEAPON, name: '쇠뇌', price: 300, grade: ItemGrade.UNCOMMON, weaponType: 'Bow', damage: 14, accuracy: 0.8, description: '강력하지만 장전이 느린 쇠뇌입니다.' },
    { id: 24, type: ItemType.WEAPON, name: '메이스', price: 230, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, description: '둔기류 무기입니다.' },

    // Rare
    { id: 25, type: ItemType.WEAPON, name: '브로드소드', price: 700, grade: ItemGrade.RARE, damage: 18, accuracy: 0.9, description: '넓은 칼날을 가진 위력적인 검입니다.' },
    { id: 26, type: ItemType.WEAPON, name: '미스릴 단검', price: 850, grade: ItemGrade.RARE, damage: 15, accuracy: 1.0, critChance: 0.15, critDamageMultiplier: 1.8, description: '가볍고 날카로운 미스릴 단검입니다.' },
    { id: 27, type: ItemType.WEAPON, name: '워해머', price: 900, grade: ItemGrade.RARE, damage: 22, accuracy: 0.8, description: '적의 방어구를 부수는 육중한 망치입니다.' },
    { id: 28, type: ItemType.WEAPON, name: '그레이트소드', price: 800, grade: ItemGrade.RARE, damage: 20, accuracy: 0.85, description: '양손으로 사용하는 거대한 검입니다.' },
    { id: 29, type: ItemType.WEAPON, name: '롱보우', price: 750, grade: ItemGrade.RARE, weaponType: 'Bow', damage: 16, accuracy: 1.0, critChance: 0.12, critDamageMultiplier: 1.7, description: '먼 거리의 적을 저격하는 장궁입니다.' },
    { id: 30, type: ItemType.WEAPON, name: '모닝스타', price: 820, grade: ItemGrade.RARE, damage: 19, accuracy: 0.88, procChance: 0.15, procDamage: 8, description: '철퇴 끝에 가시가 박혀있습니다. 15% 확률로 추가 피해를 입힙니다.' },
    { id: 31, type: ItemType.WEAPON, name: '클레이모어', price: 850, grade: ItemGrade.RARE, damage: 21, accuracy: 0.8, description: '스코틀랜드의 양손 검입니다.' },

    // Epic
    { id: 32, type: ItemType.WEAPON, name: '기사의 검', price: 1500, grade: ItemGrade.EPIC, damage: 30, accuracy: 0.95, critChance: 0.1, critDamageMultiplier: 1.7, description: '왕국을 수호하는 기사에게 주어지는 검입니다.' },
    { id: 33, type: ItemType.WEAPON, name: '암살자의 칼날', price: 1800, grade: ItemGrade.EPIC, damage: 25, accuracy: 1.1, critChance: 0.25, critDamageMultiplier: 2.2, description: '어둠 속에서 적의 심장을 노리는 칼날입니다.' },
    { id: 34, type: ItemType.WEAPON, name: '룬 블레이드', price: 1600, grade: ItemGrade.EPIC, damage: 28, accuracy: 0.9, procChance: 0.1, procDamage: 15, description: '고대 룬 문자가 새겨져 마법의 힘을 발휘합니다. 10% 확률로 마법 피해를 입힙니다.' },
    { id: 35, type: ItemType.WEAPON, name: '카타나', price: 1700, grade: ItemGrade.EPIC, damage: 26, accuracy: 1.0, critChance: 0.2, critDamageMultiplier: 2.0, description: '동방의 장인이 만든 예리한 도입니다.' },
    { id: 36, type: ItemType.WEAPON, name: '핼버드', price: 1550, grade: ItemGrade.EPIC, damage: 32, accuracy: 0.85, description: '창과 도끼를 합친 형태의 강력한 폴암입니다.' },
    { id: 37, type: ItemType.WEAPON, name: '건블레이드', price: 1900, grade: ItemGrade.EPIC, weaponType: 'Gun', damage: 27, accuracy: 0.95, critChance: 0.15, critDamageMultiplier: 1.8, description: '총과 검이 결합된 하이브리드 무기입니다.' },

    // Legendary
    { id: 38, type: ItemType.WEAPON, name: '엑스칼리버', price: 10000, grade: ItemGrade.LEGENDARY, damage: 60, accuracy: 1.0, critChance: 0.2, critDamageMultiplier: 2.5, procChance: 0.2, procDamage: 30, description: '선택받은 왕의 전설적인 성검. 20% 확률로 신성한 빛의 추가 피해를 입힙니다.' },
    { id: 39, type: ItemType.WEAPON, name: '드래곤 슬레이어', price: 8000, grade: ItemGrade.LEGENDARY, damage: 70, accuracy: 0.85, description: '용의 비늘마저 꿰뚫는 거대한 대검입니다.' },
    { id: 40, type: ItemType.WEAPON, name: '스톰브링어', price: 8500, grade: ItemGrade.LEGENDARY, weaponType: 'Bow', damage: 55, accuracy: 1.2, critChance: 0.25, critDamageMultiplier: 2.2, description: '폭풍의 힘을 담아 번개의 화살을 쏘는 활입니다.' },
    { id: 41, type: ItemType.WEAPON, name: '게이볼그', price: 9000, grade: ItemGrade.LEGENDARY, damage: 65, accuracy: 0.95, critChance: 0.15, critDamageMultiplier: 2.0, procChance: 0.3, procDamage: 25, description: '던지면 반드시 심장을 꿰뚫는다는 저주받은 마창. 30% 확률로 출혈 피해를 입힙니다.' },
    { id: 42, type: ItemType.WEAPON, name: '섀도우팽', price: 9500, grade: ItemGrade.LEGENDARY, damage: 50, accuracy: 1.1, critChance: 0.3, critDamageMultiplier: 2.8, description: '그림자에서 벼려낸 단검. 치명타에 특화되어 있습니다.' },

    // --- 신규 방어구 ---
    { id: 43, type: ItemType.ARMOR, name: '천 갑옷', price: 30, grade: ItemGrade.COMMON, defense: 2, description: '가장 기본적인 천 갑옷입니다.' },
    { id: 44, type: ItemType.ARMOR, name: '사슬 갑옷', price: 300, grade: ItemGrade.UNCOMMON, defense: 8, description: '작은 고리를 엮어 만든 갑옷입니다.' },
    { id: 45, type: ItemType.ARMOR, name: '플레이트 아머', price: 1500, grade: ItemGrade.RARE, defense: 20, description: '전신을 감싸는 판금 갑옷입니다.' },
    { id: 46, type: ItemType.ARMOR, name: '기사의 갑옷', price: 3000, grade: ItemGrade.EPIC, defense: 35, description: '고위 기사들이 입는 견고한 갑옷입니다.' },
    { id: 47, type: ItemType.ARMOR, name: '용비늘 갑옷', price: 7500, grade: ItemGrade.LEGENDARY, defense: 50, description: '용의 비늘로 만들어져 마법과 화염에 강한 저항력을 가집니다.' },

    // --- 신규 소모품 ---
    { id: 50, type: ItemType.CONSUMABLE, name: '중급 체력 물약', price: 50, grade: ItemGrade.UNCOMMON, effect: { type: 'heal', amount: 50 }, description: 'HP를 50 회복합니다.' },
    { id: 51, type: ItemType.CONSUMABLE, name: '상급 체력 물약', price: 120, grade: ItemGrade.RARE, effect: { type: 'heal', amount: 150 }, description: 'HP를 150 회복합니다.' },
    { id: 52, type: ItemType.CONSUMABLE, name: '독극물 병', price: 80, grade: ItemGrade.UNCOMMON, effect: { type: 'damage_enemy', amount: 30 }, description: '적에게 30의 독 피해를 입힙니다.' },
    { id: 53, type: ItemType.CONSUMABLE, name: '화염병', price: 150, grade: ItemGrade.RARE, effect: { type: 'damage_enemy', amount: 70 }, description: '적에게 70의 화염 피해를 입힙니다.' },
    { id: 54, type: ItemType.CONSUMABLE, name: '신성한 성수', price: 300, grade: ItemGrade.EPIC, effect: { type: 'damage_enemy', amount: 150 }, description: '언데드에게 특히 강력한 신성한 피해를 150 입힙니다.' },
    
    // --- 신규 총기류 ---
    { id: 55, type: ItemType.WEAPON, name: '낡은 권총', price: 70, grade: ItemGrade.COMMON, damage: 6, accuracy: 0.95, weaponType: 'Gun', description: '기본적인 반자동 권총입니다.' },
    { id: 56, type: ItemType.WEAPON, name: '펌프 액션 샷건', price: 280, grade: ItemGrade.UNCOMMON, damage: 15, accuracy: 0.75, weaponType: 'Gun', description: '근거리에서 강력한 위력을 발휘하는 산탄총입니다.' },
    { id: 57, type: ItemType.WEAPON, name: '기관단총', price: 320, grade: ItemGrade.UNCOMMON, damage: 9, accuracy: 0.9, weaponType: 'Gun', procChance: 0.15, procDamage: 4, description: '빠른 연사력을 자랑합니다. 15% 확률로 추가 사격을 합니다.' },
    { id: 58, type: ItemType.WEAPON, name: '돌격소총', price: 880, grade: ItemGrade.RARE, damage: 19, accuracy: 0.9, weaponType: 'Gun', description: '안정적이고 균형 잡힌 자동소총입니다.' },
    { id: 59, type: ItemType.WEAPON, name: 'AWP 저격소총', price: 2000, grade: ItemGrade.EPIC, damage: 35, accuracy: 0.9, weaponType: 'Gun', critChance: 0.3, critDamageMultiplier: 2.5, description: '한 발에 모든 것을 거는 강력한 저격소총. 치명타 확률이 매우 높습니다.' },
    { id: 60, type: ItemType.WEAPON, name: '경기관총', price: 1950, grade: ItemGrade.EPIC, damage: 28, accuracy: 0.8, weaponType: 'Gun', description: '묵직한 화력으로 적을 제압하는 기관총입니다.' },
    { id: 61, type: ItemType.WEAPON, name: '미니건', price: 9200, grade: ItemGrade.LEGENDARY, damage: 58, accuracy: 0.75, weaponType: 'Gun', procChance: 0.4, procDamage: 15, description: '분당 수천 발의 탄환을 쏟아붓는 파괴의 화신. 40% 확률로 추가 피해를 입힙니다.' },
    { id: 62, type: ItemType.WEAPON, name: '황금 총', price: 12000, grade: ItemGrade.LEGENDARY, damage: 77, accuracy: 1.0, weaponType: 'Gun', critChance: 0.5, critDamageMultiplier: 3.0, description: '모든 것을 한 방에 끝내는 전설의 황금 총. 명중률과 치명타율이 경이롭습니다.' },
    { id: 63, type: ItemType.WEAPON, name: '심판자의 철퇴', price: 9800, grade: ItemGrade.LEGENDARY, damage: 70, accuracy: 0.9, critChance: 0.1, critDamageMultiplier: 2.0, procChance: 0.2, procDamage: 110, description: '적을 심판하는 육중한 철퇴. 20% 확률로 정의의 힘이 발동하여 110의 추가 신성 피해를 입힙니다.' },
    
    // --- 추가 방어구 & 소모품 ---
    { id: 64, type: ItemType.ARMOR, name: '미스릴 셔츠', price: 900, grade: ItemGrade.RARE, defense: 18, description: '가볍고 튼튼한 미스릴로 짠 셔츠입니다.' },
    { id: 65, type: ItemType.ARMOR, name: '그림자 로브', price: 2800, grade: ItemGrade.EPIC, defense: 32, description: '어둠에 몸을 숨기기 좋은 로브. 약간의 마법 저항력도 있습니다.' },
    { id: 66, type: ItemType.ARMOR, name: '수호자의 갑옷', price: 7000, grade: ItemGrade.LEGENDARY, defense: 48, description: '고대 수호자들의 힘이 깃든 갑옷입니다.' },
    { id: 67, type: ItemType.CONSUMABLE, name: '최상급 체력 물약', price: 250, grade: ItemGrade.EPIC, effect: { type: 'heal', amount: 300 }, description: 'HP를 300 회복합니다.' },
    { id: 68, type: ItemType.CONSUMABLE, name: '엘릭서', price: 1000, grade: ItemGrade.LEGENDARY, effect: { type: 'heal', amount: 9999 }, description: 'HP를 완전히 회복시킵니다.' },
    { id: 69, type: ItemType.CONSUMABLE, name: '강력한 화염병', price: 400, grade: ItemGrade.EPIC, effect: { type: 'damage_enemy', amount: 120 }, description: '적에게 120의 강력한 화염 피해를 입힙니다.' },
];

const allMaterials: Material[] = [
    { id: 6, name: '철광석', description: '강철을 만드는 데 사용되는 기본적인 광물입니다.' },
    { id: 7, name: '가죽', description: '동물에게서 얻을 수 있는 질긴 가죽입니다.' },
    { id: 12, name: '마력의 돌', description: '신비한 마력이 깃든 돌. 강화에 사용됩니다.' },
];

const allRecipes: Recipe[] = [
    { id: 1, name: '강철 검 제작', result: allItems.find(item => item.id === 3)!, materials: [{ materialId: 6, quantity: 5 }], requiredCraftingLevel: 1 },
    { id: 2, name: '가죽 갑옷 제작', result: allItems.find(item => item.id === 4)!, materials: [{ materialId: 7, quantity: 10 }], requiredCraftingLevel: 1 },
];

const allMonsters: Monster[] = [
    { id: 1, name: '슬라임', hp: 20, maxHp: 20, attack: 5, defense: 0, xp: 5, gold: 10, drops: [{ itemId: 7, chance: 0.1, quantity: 1 }], emoji: '🦠' },
    { id: 2, name: '고블린', hp: 30, maxHp: 30, attack: 6, defense: 2, xp: 10, gold: 20, drops: [{ itemId: 2, chance: 0.05, quantity: 1 }], emoji: '👺' },
    { id: 3, name: '오크', hp: 45, maxHp: 45, attack: 8, defense: 3, xp: 20, gold: 40, drops: [{ itemId: 3, chance: 0.02, quantity: 1 }], emoji: '👹' },
    { id: 4, name: '던전 가디언', hp: 130, maxHp: 130, attack: 18, defense: 7, xp: 100, gold: 200, drops: [{ itemId: 12, chance: 0.5, quantity: 2 }], emoji: '🤖' },
];

const allDungeons: Dungeon[] = [
    { id: 0, name: '슬라임 굴', description: '가장 약한 슬라임들이 모여있는 동굴입니다. 모험의 첫걸음으로 안성맞춤입니다.', difficulty: 1, stages: 10, monsters: [1, 1, 1, 1, 2, 1, 1, 2, 1, 2], rewards: { xp: 150, gold: 250, items: [{ itemId: 7, quantity: 5 }] } },
    { id: 1, name: '고블린 동굴', description: '초보 모험가에게 적합한 동굴입니다. 고블린들이 서식하고 있습니다.', difficulty: 2, stages: 10, monsters: [2, 2, 2, 3, 2, 3, 2, 3, 3, 3], rewards: { xp: 500, gold: 1000, items: [{ itemId: 12, quantity: 3 }] } },
    { id: 2, name: '오크의 전초기지', description: '강력한 오크들이 지키고 있는 전초기지입니다. 단단히 준비해야 합니다.', difficulty: 3, stages: 10, monsters: [3, 3, 3, 3, 3, 4, 3, 4, 3, 4], rewards: { xp: 2500, gold: 5000, items: [{ itemId: 8, quantity: 1 }, { itemId: 12, quantity: 10 }] } },
];

const allQuests: Omit<Quest, 'currentProgress' | 'isCompleted'>[] = [
    {
        id: 1,
        title: '초보 사냥꾼',
        description: '슬라임을 5마리 처치하세요.',
        type: 'DEFEAT_MONSTER',
        targetId: 1, // Slime ID
        targetQuantity: 5,
        rewards: { xp: 50, gold: 100 }
    },
    {
        id: 2,
        title: '가죽 수집',
        description: '가죽을 10개 모으세요.',
        type: 'COLLECT_ITEM',
        targetId: 7, // Leather ID
        targetQuantity: 10,
        rewards: { xp: 30, gold: 150 }
    },
    {
        id: 3,
        title: '첫 번째 제작',
        description: '강철 검을 1개 제작하세요.',
        type: 'CRAFT_ITEM',
        targetId: 3, // Steel Sword ID
        targetQuantity: 1,
        rewards: { xp: 100, gold: 200, items: [{ itemId: 12, quantity: 2 }] } // Magic Stone reward
    }
];

const townLevels = [
    { name: "폐허", xpRequired: 0, costToUpgrade: 1000 },
    { name: "작은 마을", xpRequired: 100, costToUpgrade: 3000 },
    { name: "도시", xpRequired: 500, costToUpgrade: 12000 },
    { name: "성", xpRequired: 2000, costToUpgrade: 50000 },
    { name: "왕국", xpRequired: 10000, costToUpgrade: Infinity },
];

const trophyRoadMilestones = [
    { trophies: 100, rewards: { gold: 500 } },
    { trophies: 250, rewards: { items: [{ itemId: 12, quantity: 5 }] } },
    { trophies: 500, rewards: { gold: 2000, items: [{ itemId: 9, quantity: 1 }] } },
    { trophies: 1000, rewards: { gold: 10000, items: [{ itemId: 10, quantity: 1 }] } },
];

const getInitialPlayerStats = (): PlayerStats => ({
    playerName: '모험가',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    maxHp: 50,
    hp: 50,
    attack: 5,
    defense: 2,
    gold: 100,
    craftingLevel: 1,
    craftingXp: 0,
    craftingXpToNextLevel: 50,
    trophies: 0,
    claimedTrophyRewards: [],
    inventory: [{ ...allItems.find(i => i.id === 1)!, quantity: 1 }],
    equipment: {
        weapon: allItems.find(i => i.id === 1)!,
        armor: null,
    },
    playerClass: null,
    townLevel: 1,
    townXp: 0,
    activeQuests: [],
    pets: [],
    activePetId: null,
});

// --- UTILITY FUNCTIONS ---
const formatNumber = (num: number) => num.toLocaleString();

const getDisplayName = (item: Item | null | undefined): string => {
    if (!item) return '없음';
    if (item.enhancementLevel && item.enhancementLevel > 0) {
        return `+${item.enhancementLevel} ${item.name}`;
    }
    return item.name;
};

// --- COMPONENTS ---

const StatBar = ({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string; }) => (
    <div className="stat-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.9em' }}>
            <span>{label}</span>
            <span>{formatNumber(value)} / {formatNumber(maxValue)}</span>
        </div>
        <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

const PlayerStatsView = ({ playerStats, setPlayerStats, setView }: { playerStats: PlayerStats; setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>; setView: (view: string) => void }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(playerStats.playerName);

    const handleNameChange = () => {
        if (newName.trim() !== "") {
            setPlayerStats(prev => ({ ...prev, playerName: newName.trim() }));
            setIsEditingName(false);
        }
    };

    const totalAttack = useMemo(() => {
        const weaponDamage = playerStats.equipment.weapon?.damage || 0;
        const enhancementBonus = playerStats.equipment.weapon?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.attackBonus || 0 : 0;
        return playerStats.attack + weaponDamage + (enhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armorDefense = playerStats.equipment.armor?.defense || 0;
        const enhancementBonus = playerStats.equipment.armor?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.defenseBonus || 0 : 0;
        return playerStats.defense + armorDefense + enhancementBonus + petBonus;
    }, [playerStats]);

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                 {isEditingName ? (
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        onBlur={handleNameChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameChange()}
                        autoFocus
                    />
                ) : (
                    <h2>
                        {playerStats.playerName}
                        <button className="edit-name-btn" onClick={() => setIsEditingName(true)}>✏️</button>
                    </h2>
                )}
            </div>
            <p>레벨: {playerStats.level} ({playerStats.playerClass ? PlayerClasses[playerStats.playerClass].name : "모험가"})</p>
            <StatBar value={playerStats.hp} maxValue={playerStats.maxHp} color="#4caf50" label="HP" />
            <StatBar value={playerStats.xp} maxValue={playerStats.xpToNextLevel} color="#2196f3" label="XP" />
            <p>공격력: {totalAttack}</p>
            <p>방어력: {totalDefense}</p>
            <p>골드: {formatNumber(playerStats.gold)} G</p>
            <p>트로피: {formatNumber(playerStats.trophies)} 🏆</p>
            <h3>장비</h3>
            <p>무기: <span className={playerStats.equipment.weapon ? ItemGradeInfo[playerStats.equipment.weapon.grade]?.class : ''}>{getDisplayName(playerStats.equipment.weapon)}</span></p>
            <p>갑옷: <span className={playerStats.equipment.armor ? ItemGradeInfo[playerStats.equipment.armor.grade]?.class : ''}>{getDisplayName(playerStats.equipment.armor)}</span></p>
            
            <InventoryView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />
        </div>
    );
};

const TownView = ({ playerStats, setView }: { playerStats: PlayerStats, setView: (view: string) => void }) => (
    <div className="card town-layout">
        <h2>마을</h2>
        <p>환장RPG에 오신 것을 환영합니다! 무엇을 하시겠습니까?</p>
        <div className="town-grid">
            <button onClick={() => setView(View.PLAYER)}>내 정보</button>
            <button onClick={() => setView(View.SHOP)}>상점</button>
            <button onClick={() => setView(View.BLACKSMITH)}>대장간</button>
            <button onClick={() => setView(View.QUEST_BOARD)}>퀘스트</button>
            <button onClick={() => {
                if (playerStats.level < 10) {
                    alert('직업 선택은 10레벨부터 가능합니다.');
                } else {
                    setView(View.CLASS_SELECTION);
                }
            }}>직업</button>
            <button onClick={() => setView(View.GACHA_SHRINE)}>뽑기 성소</button>
            <button onClick={() => setView(View.TOWN_HALL)}>마을 회관</button>
            <button onClick={() => setView(View.TROPHY_ROAD)}>트로피 로드</button>
            <button onClick={() => setView(View.PETS)}>반려동물</button>
        </div>
        <div className="town-main-actions">
            <button onClick={() => setView(View.BATTLE)}>전투 시작</button>
            <button onClick={() => setView(View.DUNGEON)}>던전</button>
        </div>
    </div>
);

const ShopView = ({ playerStats, setPlayerStats, setView }: { playerStats: PlayerStats; setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>; setView: (view: string) => void }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [shopTab, setShopTab] = useState('Weapons');
    
    const sortedShopItems = useMemo(() => {
        return [...allItems]
            .filter(item => item.type !== ItemType.MATERIAL)
            .sort((a, b) => {
                const gradeOrderA = ItemGradeInfo[a.grade]?.order || 0;
                const gradeOrderB = ItemGradeInfo[b.grade]?.order || 0;
                if (gradeOrderA !== gradeOrderB) {
                    return gradeOrderA - gradeOrderB;
                }
                return a.price - b.price;
            });
    }, []);


    const handleBuy = () => {
        if (selectedItem && playerStats.gold >= selectedItem.price) {
            setPlayerStats(prev => {
                const newInventory = [...prev.inventory];
                const existingItem = newInventory.find(i => i.id === selectedItem.id && !(i.enhancementLevel > 0)); // Only stack non-enhanced items
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    newInventory.push({ ...selectedItem, quantity: 1 });
                }
                return {
                    ...prev,
                    gold: prev.gold - selectedItem.price,
                    inventory: newInventory
                };
            });
            alert(`${selectedItem.name}을(를) 구매했습니다!`);
        } else {
            alert('골드가 부족합니다.');
        }
    };

    const itemsToDisplay = sortedShopItems.filter(item => {
        if (shopTab === 'Weapons') return item.type === ItemType.WEAPON;
        if (shopTab === 'Armor') return item.type === ItemType.ARMOR;
        if (shopTab === 'Consumables') return item.type === ItemType.CONSUMABLE;
        return false;
    });

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>상점</h2>
             <div className="shop-tabs">
                <button className={shopTab === 'Weapons' ? 'active' : ''} onClick={() => setShopTab('Weapons')}>무기</button>
                <button className={shopTab === 'Armor' ? 'active' : ''} onClick={() => setShopTab('Armor')}>방어구</button>
                <button className={shopTab === 'Consumables' ? 'active' : ''} onClick={() => setShopTab('Consumables')}>소모품</button>
            </div>
            <div className="shop-grid">
                {itemsToDisplay.map(item => (
                    <div
                        key={item.id}
                        className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedItem(item)}
                    >
                        <strong className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)}</strong>
                        <p>{item.price} G</p>
                    </div>
                ))}
            </div>
            {selectedItem && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3>{getDisplayName(selectedItem)} <span className={ItemGradeInfo[selectedItem.grade]?.class}>({ItemGradeInfo[selectedItem.grade]?.name})</span></h3>
                    <p>{selectedItem.description}</p>
                    {selectedItem.damage && <p>공격력: {selectedItem.damage}</p>}
                    {selectedItem.defense && <p>방어력: {selectedItem.defense}</p>}
                    {selectedItem.critChance && <p>치명타 확률: {selectedItem.critChance * 100}%</p>}
                    <p>가격: {selectedItem.price} G</p>
                    <button onClick={handleBuy} disabled={playerStats.gold < selectedItem.price}>구매</button>
                </div>
            )}
        </div>
    );
};

const InventoryView = ({ playerStats, setPlayerStats }: { playerStats: PlayerStats; setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>; setView: (view: string) => void }) => {

    const handleEquip = (itemToEquip: Item & { quantity: number }) => {
        setPlayerStats(prev => {
            const newEquipment = { ...prev.equipment };
            let newInventory = [...prev.inventory];
            let previouslyEquipped = null;

            if (itemToEquip.type === ItemType.WEAPON) {
                previouslyEquipped = newEquipment.weapon;
                newEquipment.weapon = itemToEquip;
            } else if (itemToEquip.type === ItemType.ARMOR) {
                previouslyEquipped = newEquipment.armor;
                newEquipment.armor = itemToEquip;
            }

            // Remove equipped item from inventory
            const itemInInventory = newInventory.find(i => i.id === itemToEquip.id && i.enhancementLevel === itemToEquip.enhancementLevel)!;
            if (itemInInventory.quantity > 1) {
                itemInInventory.quantity -= 1;
            } else {
                newInventory = newInventory.filter(i => i !== itemInInventory);
            }

            // Add previously equipped item back to inventory
            if (previouslyEquipped) {
                 const existingItem = newInventory.find(i => i.id === previouslyEquipped!.id && i.enhancementLevel === previouslyEquipped!.enhancementLevel);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    newInventory.push({ ...previouslyEquipped, quantity: 1 });
                }
            }

            return { ...prev, equipment: newEquipment, inventory: newInventory };
        });
    };
    
     const handleUse = (itemToUse: Item) => {
        if (itemToUse.type === ItemType.CONSUMABLE && itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect!.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                
                return { ...prev, hp: newHp, inventory: newInventory };
            });
        }
    };
    
    return (
        <div className="card" style={{marginTop: '20px'}}>
            <h3>인벤토리</h3>
            <div className="inventory-list">
                {playerStats.inventory.length > 0 ? playerStats.inventory.map((item, index) => (
                    <div key={`${item.id}-${index}-${item.enhancementLevel || 0}`} className="inventory-item">
                        <span><strong className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)}</strong> (x{item.quantity})</span>
                        <div>
                             {item.type === ItemType.WEAPON || item.type === ItemType.ARMOR ? (
                                <button onClick={() => handleEquip(item)}>장착</button>
                            ) : null}
                            {item.type === ItemType.CONSUMABLE ? (
                                <button onClick={() => handleUse(item)}>사용</button>
                            ): null}
                        </div>
                    </div>
                )) : <p>인벤토리가 비어있습니다.</p>}
            </div>
        </div>
    );
};

const BattleView = ({ playerStats, setPlayerStats, setView }: { playerStats: PlayerStats; setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>; setView: (view: string) => void }) => {
    const [monster, setMonster] = useState<Monster | null>(null);
    const [battleLog, setBattleLog] = useState<React.ReactNode[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [isBattleOver, setIsBattleOver] = useState(false);
    const [damagePopups, setDamagePopups] = useState<DamagePopupInfo[]>([]);
    const [playerAttacking, setPlayerAttacking] = useState(false);
    const [enemyAttacking, setEnemyAttacking] = useState(false);
    const [ultimateCharge, setUltimateCharge] = useState(0);
    const [showInventory, setShowInventory] = useState(false);
    
    const addDamagePopup = useCallback((amount: string, isCrit: boolean, target: 'player' | 'enemy') => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, amount, isCrit, target }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 600);
    }, []);

    const addLog = useCallback((message: string, type: string, petSkill: boolean = false) => {
      const className = petSkill ? 'pet-skill-message' : type;
      setBattleLog(prev => [...prev, <p key={prev.length} className={className}>{message}</p>]);
    }, []);

    const totalAttack = useMemo(() => {
        const weapon = playerStats.equipment.weapon;
        const weaponDamage = weapon?.damage || 0;
        const enhancementBonus = weapon?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.attackBonus || 0 : 0;
        return playerStats.attack + weaponDamage + (enhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armor = playerStats.equipment.armor;
        const armorDefense = armor?.defense || 0;
        const enhancementBonus = armor?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.defenseBonus || 0 : 0;
        return playerStats.defense + armorDefense + enhancementBonus + petBonus;
    }, [playerStats]);
    
    const activePet = useMemo(() => playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId) : null, [playerStats.activePetId, playerStats.pets]);

    const playerConsumables = useMemo(() => 
        playerStats.inventory.filter(i => i.type === ItemType.CONSUMABLE), 
        [playerStats.inventory]
    );

    useEffect(() => {
        // 던전 가디언(id: 4)은 일반 전투에서 제외
        const normalMonsters = allMonsters.filter(m => m.id !== 4);
        const randomMonster = { ...normalMonsters[Math.floor(Math.random() * normalMonsters.length)] };
        setMonster(randomMonster);
        addLog(`${randomMonster.name}이(가) 나타났다!`, 'system-message');
    }, [addLog]);

    const handleBattleEnd = useCallback((win: boolean) => {
        setIsBattleOver(true);
        if (win && monster) {
            const goldEarned = monster.gold;
            const xpEarned = monster.xp;
            const trophiesGained = monster.id * 5; // Simple trophy logic
            addLog(`승리! ${goldEarned} G와 ${xpEarned} XP, 트로피 ${trophiesGained}개를 획득했다!`, 'system-message');
            
            const townXpGained = Math.floor(monster.xp / 2);
            if (townXpGained > 0) {
                 addLog(`마을 경험치 ${townXpGained} XP를 획득했다!`, 'effect-message');
            }

            const itemDrops: (Item & { quantity: number })[] = [];
            monster.drops?.forEach(drop => {
                if (Math.random() < drop.chance) {
                    const droppedItem = allItems.find(item => item.id === drop.itemId);
                    if (droppedItem) {
                        itemDrops.push({ ...droppedItem, quantity: drop.quantity });
                        addLog(`${droppedItem.name}을(를) 획득했다!`, 'effect-message');
                    }
                }
            });

            setPlayerStats(prev => {
                let newXp = prev.xp + xpEarned;
                let newLevel = prev.level;
                let newMaxHp = prev.maxHp;
                let newAttack = prev.attack;
                let newDefense = prev.defense;
                let newXpToNextLevel = prev.xpToNextLevel;
                let goldFromLevelUp = 0;

                while (newXp >= newXpToNextLevel) {
                    newXp -= newXpToNextLevel;
                    newLevel++;
                    newMaxHp += 10;
                    newAttack += 2;
                    newDefense += 1;
                    newXpToNextLevel = Math.floor(newXpToNextLevel * 1.2);
                    goldFromLevelUp += newLevel * 100;
                    addLog(`레벨 업! ${newLevel}레벨이 되었다!`, 'system-message');
                }
                
                if (goldFromLevelUp > 0) {
                     addLog(`레벨 업 보너스로 ${goldFromLevelUp} G를 획득했다!`, 'system-message');
                }

                const newInventory = [...prev.inventory];
                itemDrops.forEach(droppedItem => {
                    const existingItem = newInventory.find(i => i.id === droppedItem.id && !(i.enhancementLevel > 0));
                    if (existingItem) {
                        existingItem.quantity += droppedItem.quantity;
                    } else {
                        newInventory.push(droppedItem);
                    }
                });

                 const updatedQuests = prev.activeQuests.map(quest => {
                    if (quest.isCompleted) return quest;

                    let newProgress = quest.currentProgress;
                    if (quest.type === 'DEFEAT_MONSTER' && quest.targetId === monster.id) {
                        newProgress += 1;
                    }
                    if (quest.type === 'COLLECT_ITEM') {
                        const relevantDrop = itemDrops.find(d => d.id === quest.targetId);
                        if (relevantDrop) {
                             newProgress += relevantDrop.quantity;
                        }
                    }
                    return { ...quest, currentProgress: Math.min(quest.targetQuantity, newProgress) };
                });

                return {
                    ...prev,
                    hp: prev.hp, // HP no longer fully heals after battle
                    xp: newXp,
                    level: newLevel,
                    maxHp: newMaxHp,
                    attack: newAttack,
                    defense: newDefense,
                    xpToNextLevel: newXpToNextLevel,
                    gold: prev.gold + goldEarned + goldFromLevelUp,
                    inventory: newInventory,
                    trophies: prev.trophies + trophiesGained,
                    townXp: prev.townXp + townXpGained,
                    activeQuests: updatedQuests,
                };
            });
        } else {
            addLog('패배했다...', 'system-message');
            setPlayerStats(prev => ({...prev, hp: 1 })); // Revive with 1 HP
        }
    }, [addLog, monster, setPlayerStats]);
    
    const handleEnemyTurn = useCallback(() => {
        if (!monster) return;

        if (monster.statusEffects?.stun && monster.statusEffects.stun > 0) {
            addLog(`${monster.name}이(가) 기절해서 움직일 수 없다!`, 'system-message');
            setMonster(prev => ({...prev!, statusEffects: { stun: prev!.statusEffects!.stun - 1 }}));
            setIsPlayerTurn(true);
            return;
        }

        setEnemyAttacking(true);
        setTimeout(() => setEnemyAttacking(false), 400);

        let damage = Math.max(1, monster.attack - totalDefense);
        addLog(`${monster.name}의 공격! ${playerStats.playerName}에게 ${damage}의 피해를 입혔다.`, 'enemy-turn');
        addDamagePopup(String(damage), false, 'player');
        const newPlayerHp = playerStats.hp - damage;
        setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));
        if (newPlayerHp <= 0) {
            handleBattleEnd(false);
        } else {
            setIsPlayerTurn(true);
        }
    }, [monster, playerStats, totalDefense, addLog, addDamagePopup, handleBattleEnd, setPlayerStats]);


    const handlePlayerAttack = () => {
        if (!isPlayerTurn || isBattleOver || !monster) return;

        setPlayerAttacking(true);
        setTimeout(() => setPlayerAttacking(false), 400);

        const weapon = playerStats.equipment.weapon;
        const accuracy = weapon?.accuracy || 0.9;

        if (Math.random() > accuracy) {
            addLog(`${playerStats.playerName}의 공격이 빗나갔다!`, 'player-turn');
        } else {
            const baseCritChance = playerStats.playerClass === 'Archer' ? PlayerClasses.Archer.bonuses.critChance : 0;
            const critChance = (weapon?.critChance || 0.05) + baseCritChance;
            const isCrit = Math.random() < critChance;
            const critMultiplier = weapon?.critDamageMultiplier || 1.5;
            let damage = totalAttack;
            damage = isCrit ? Math.floor(damage * critMultiplier) : damage;
            damage = Math.max(1, damage - monster.defense);
            
            addLog(`${playerStats.playerName}의 공격! ${monster.name}에게 ${damage}의 피해를 입혔다.${isCrit ? ' (치명타!)' : ''}`, 'player-turn');
            addDamagePopup(String(damage), isCrit, 'enemy');
            
            const procChance = weapon?.procChance || 0;
            if (weapon && weapon.procDamage && Math.random() < procChance) {
                const procDamage = weapon.procDamage;
                 addLog(`${getDisplayName(weapon)}의 특수 효과 발동! ${procDamage}의 추가 피해!`, 'effect-message');
                 damage += procDamage;
            }

            if (activePet && Math.random() < activePet.skillProcChance && activePet.skillEffect?.type === 'damage') {
                const petDamage = activePet.skillEffect.amount || 0;
                damage += petDamage;
                addLog(`${activePet.name}의 스킬 '${activePet.skillName}'! ${petDamage}의 추가 피해!`, 'player-turn', true);
            }

            const newMonsterHp = monster.hp - damage;
            setMonster({ ...monster, hp: newMonsterHp });

            if (newMonsterHp <= 0) {
                handleBattleEnd(true);
                return;
            }
        }
        
        setUltimateCharge(prev => Math.min(5, prev + 1));
        setIsPlayerTurn(false);
    };

    const handleUsePotion = (itemToUse: Item & { quantity: number }) => {
        if (!isPlayerTurn || isBattleOver || !monster) return;

        if (itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect!.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                
                addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 사용해 HP를 ${itemToUse.effect!.amount} 회복했다.`, 'player-turn');

                return { ...prev, hp: newHp, inventory: newInventory };
            });
            
            setShowInventory(false);
            setUltimateCharge(prev => Math.min(5, prev + 1));
            setIsPlayerTurn(false);
        } else if (itemToUse.effect?.type === 'damage_enemy') {
            const damage = itemToUse.effect.amount;
            addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 던져 ${monster.name}에게 ${damage}의 피해를 입혔다!`, 'player-turn');
            addDamagePopup(String(damage), false, 'enemy');

            const newMonsterHp = monster.hp - damage;
            setMonster({ ...monster, hp: newMonsterHp });

            setPlayerStats(prev => {
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                return { ...prev, inventory: newInventory };
            });
            
            setShowInventory(false);
            setUltimateCharge(prev => Math.min(5, prev + 1));
            
            if (newMonsterHp <= 0) {
                handleBattleEnd(true);
            } else {
                setIsPlayerTurn(false);
            }
        }
    };

    const handleUseUltimate = () => {
        if (ultimateCharge < 5 || !isPlayerTurn || isBattleOver || !monster) return;
        
        const playerClass = playerStats.playerClass || 'Adventurer';
        let damage = 0;
        let logMessage = '';

        if (playerClass === 'Warrior') {
            damage = Math.floor(totalAttack * 3);
            damage = Math.max(1, damage - monster.defense);
            const stunApplied = Math.random() < 0.5;
            if (stunApplied) {
                setMonster(prev => ({...prev!, statusEffects: { stun: 1 }}));
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입히고 기절시켰다!`;
            } else {
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입혔다!`;
            }
        } else if (playerClass === 'Archer') {
            const weapon = playerStats.equipment.weapon;
            const critMultiplier = (weapon?.critDamageMultiplier || 1.5) * 2;
            damage = Math.floor(totalAttack * critMultiplier);
            damage = Math.max(1, damage - monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Archer.name}'! ${monster.name}에게 ${damage}의 치명적인 피해를 입혔다!`;
        } else { // Adventurer
            damage = Math.floor(totalAttack * 2.5);
            damage = Math.max(1, damage - monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Adventurer.name}'! ${monster.name}에게 ${damage}의 강력한 피해를 입혔다!`;
        }

        addLog(logMessage, 'player-turn');
        addDamagePopup(String(damage), true, 'enemy');

        const newMonsterHp = monster.hp - damage;
        setMonster(m => ({ ...m!, hp: newMonsterHp }));
        
        setUltimateCharge(0);

        if (newMonsterHp <= 0) {
            handleBattleEnd(true);
        } else {
            setIsPlayerTurn(false);
        }
    };

    useEffect(() => {
        if (!isPlayerTurn && !isBattleOver) {
            const timer = setTimeout(() => handleEnemyTurn(), 1000);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, isBattleOver, handleEnemyTurn]);

    if (!monster) return <div className="card">로딩 중...</div>;

    return (
        <div className="card">
            {showInventory && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>아이템 사용</h3>
                        <div className="battle-inventory-list">
                            {playerConsumables.length > 0 ? playerConsumables.map(item => (
                                <div key={item.id} className="inventory-item">
                                    <span><strong className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)}</strong> (x{item.quantity})</span>
                                    <button onClick={() => handleUsePotion(item)}>사용</button>
                                </div>
                            )) : <p>사용할 수 있는 소모품이 없습니다.</p>}
                        </div>
                        <button onClick={() => setShowInventory(false)}>닫기</button>
                    </div>
                </div>
            )}
             <div className="combat-screen">
                <div className={`character-container player-side ${playerAttacking ? 'attacking' : ''}`}>
                    <StatBar value={playerStats.hp} maxValue={playerStats.maxHp} color="#4caf50" label={playerStats.playerName} />
                    <span className="character">🧑‍🚀</span>
                    {activePet && <span className="pet-character">
                        {activePet.type === 'Griffin' ? '🦅' : activePet.type === 'Turtle' ? '🐢' : '🐲'}
                    </span>}
                    {damagePopups.filter(p => p.target === 'player').map(p => (
                        <div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>
                    ))}
                </div>
                <div className={`character-container enemy-side ${enemyAttacking ? 'attacking' : ''}`}>
                    <StatBar value={monster.hp} maxValue={monster.maxHp} color="#f44336" label={monster.name} />
                    <span className="character">{monster.emoji}</span>
                     {damagePopups.filter(p => p.target === 'enemy').map(p => (
                        <div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>
                    ))}
                </div>
            </div>
            
            <div className="battle-log" ref={el => el?.scrollTo(0, el.scrollHeight)}>
                {battleLog}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {isBattleOver ? (
                    <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
                ) : (
                    <div className="battle-actions">
                        <button onClick={handlePlayerAttack} disabled={!isPlayerTurn}>공격</button>
                        <button onClick={() => setShowInventory(true)} disabled={!isPlayerTurn}>아이템</button>
                        <button onClick={handleUseUltimate} disabled={!isPlayerTurn || ultimateCharge < 5} className="ultimate-button">
                            궁극기 ({ultimateCharge}/5)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClassSelectionView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {
    const handleSelectClass = (className: keyof typeof PlayerClasses) => {
        if (playerStats.playerClass) {
            alert("이미 직업을 선택했습니다.");
            return;
        }

        const selectedClass = PlayerClasses[className];
        if (confirm(`${selectedClass.name}을(를) 선택하시겠습니까? 직업은 변경할 수 없습니다.`)) {
            setPlayerStats(prev => {
                const bonuses = selectedClass.bonuses;
                const newMaxHp = prev.maxHp + (bonuses.maxHp || 0);
                return {
                    ...prev,
                    playerClass: className,
                    attack: prev.attack + (bonuses.attack || 0),
                    defense: prev.defense + (bonuses.defense || 0),
                    maxHp: newMaxHp,
                    hp: newMaxHp, // Full heal on class change
                };
            });
            alert(`${selectedClass.name}(으)로 전직했습니다!`);
            setView(View.TOWN);
        }
    };

    if (playerStats.playerClass) {
        const currentClass = PlayerClasses[playerStats.playerClass];
        return (
            <div className="card">
                <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
                <h2>나의 직업</h2>
                <h3>{currentClass.name}</h3>
                <p>{currentClass.description}</p>
                <p>당신은 이미 자신의 길을 걷고 있습니다.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>직업 선택</h2>
            <p>10레벨이 되어 새로운 힘에 눈을 떴습니다! 당신의 길을 선택하세요. (한 번 선택하면 변경할 수 없습니다)</p>
            <div className="class-selection-grid">
                {Object.entries(PlayerClasses).map(([key, value]) => (
                    <div key={key} className="card class-card">
                        <h3>{value.name}</h3>
                        <p>{value.description}</p>
                        <button onClick={() => handleSelectClass(key as keyof typeof PlayerClasses)}>선택</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DungeonBattleView = ({ dungeon, playerStats, setPlayerStats, endDungeon }: {
    dungeon: Dungeon;
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    endDungeon: (success: boolean) => void;
}) => {
    const [currentStage, setCurrentStage] = useState(1);
    const [monster, setMonster] = useState<Monster | null>(null);
    const [battleLog, setBattleLog] = useState<React.ReactNode[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [damagePopups, setDamagePopups] = useState<DamagePopupInfo[]>([]);
    const [playerAttacking, setPlayerAttacking] = useState(false);
    const [enemyAttacking, setEnemyAttacking] = useState(false);
    const [ultimateCharge, setUltimateCharge] = useState(0);
    const [showInventory, setShowInventory] = useState(false);
    
    const addDamagePopup = useCallback((amount: string, isCrit: boolean, target: 'player' | 'enemy') => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, amount, isCrit, target }]);
        setTimeout(() => setDamagePopups(prev => prev.filter(p => p.id !== id)), 600);
    }, []);

    const addLog = useCallback((message: string, type: string, petSkill: boolean = false) => {
        const className = petSkill ? 'pet-skill-message' : type;
        setBattleLog(prev => [...prev, <p key={prev.length} className={className}>{message}</p>]);
    }, []);

    const totalAttack = useMemo(() => {
        const weapon = playerStats.equipment.weapon;
        const weaponDamage = weapon?.damage || 0;
        const enhancementBonus = weapon?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.attackBonus || 0 : 0;
        return playerStats.attack + weaponDamage + (enhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armor = playerStats.equipment.armor;
        const armorDefense = armor?.defense || 0;
        const enhancementBonus = armor?.enhancementLevel || 0;
        const petBonus = playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId)?.defenseBonus || 0 : 0;
        return playerStats.defense + armorDefense + enhancementBonus + petBonus;
    }, [playerStats]);
    
    const activePet = useMemo(() => playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId) : null, [playerStats.activePetId, playerStats.pets]);

    const playerConsumables = useMemo(() => 
        playerStats.inventory.filter(i => i.type === ItemType.CONSUMABLE), 
        [playerStats.inventory]
    );

    useEffect(() => {
        const monsterId = dungeon.monsters[currentStage - 1];
        const newMonster = { ...allMonsters.find(m => m.id === monsterId)! };
        setMonster(newMonster);
        setIsPlayerTurn(true);
        addLog(`스테이지 ${currentStage}: ${newMonster.name}이(가) 나타났다!`, 'system-message');
    }, [dungeon, currentStage, addLog]);

    const handleMonsterDefeated = useCallback(() => {
        if (!monster) return;

        const goldEarned = monster.gold;
        const xpEarned = monster.xp;
        addLog(`승리! ${goldEarned} G와 ${xpEarned} XP를 획득했다!`, 'system-message');
        
        const townXpGained = Math.floor(monster.xp / 2);
        if (townXpGained > 0) {
            addLog(`마을 경험치 ${townXpGained} XP를 획득했다!`, 'effect-message');
        }

        const itemDrops: (Item & { quantity: number })[] = [];
        monster.drops?.forEach(drop => {
            if (Math.random() < drop.chance) {
                const droppedItem = allItems.find(item => item.id === drop.itemId);
                if (droppedItem) {
                    itemDrops.push({ ...droppedItem, quantity: drop.quantity });
                    addLog(`${droppedItem.name}을(를) 획득했다!`, 'effect-message');
                }
            }
        });

        setPlayerStats(prev => {
            let newXp = prev.xp + xpEarned;
            let newLevel = prev.level;
            let newMaxHp = prev.maxHp;
            let newAttack = prev.attack;
            let newDefense = prev.defense;
            let newXpToNextLevel = prev.xpToNextLevel;

            while (newXp >= newXpToNextLevel) {
                newXp -= newXpToNextLevel;
                newLevel++;
                newMaxHp += 10;
                newAttack += 2;
                newDefense += 1;
                newXpToNextLevel = Math.floor(newXpToNextLevel * 1.2);
                addLog(`레벨 업! ${newLevel}레벨이 되었다!`, 'system-message');
            }

            const newInventory = [...prev.inventory];
            itemDrops.forEach(droppedItem => {
                const existingItem = newInventory.find(i => i.id === droppedItem.id && !(i.enhancementLevel > 0));
                if (existingItem) {
                    existingItem.quantity += droppedItem.quantity;
                } else {
                    newInventory.push(droppedItem);
                }
            });
            
             const updatedQuests = prev.activeQuests.map(quest => {
                if (quest.isCompleted) return quest;

                let newProgress = quest.currentProgress;
                if (quest.type === 'DEFEAT_MONSTER' && quest.targetId === monster.id) {
                    newProgress += 1;
                }
                if (quest.type === 'COLLECT_ITEM') {
                    const relevantDrop = itemDrops.find(d => d.id === quest.targetId);
                    if (relevantDrop) {
                        newProgress += relevantDrop.quantity;
                    }
                }
                return { ...quest, currentProgress: Math.min(quest.targetQuantity, newProgress) };
            });

            return { ...prev, xp: newXp, level: newLevel, maxHp: newMaxHp, attack: newAttack, defense: newDefense, xpToNextLevel: newXpToNextLevel, gold: prev.gold + goldEarned, inventory: newInventory, townXp: prev.townXp + townXpGained, activeQuests: updatedQuests };
        });

        if (currentStage < dungeon.stages) {
            setTimeout(() => setCurrentStage(prev => prev + 1), 1500);
        } else {
            addLog(`던전 '${dungeon.name}' 클리어! 최종 보상을 획득합니다!`, 'system-message');
            setPlayerStats(prev => {
                let finalXp = prev.xp + dungeon.rewards.xp;
                let finalGold = prev.gold + dungeon.rewards.gold;
                const newInventory = [...prev.inventory];
                dungeon.rewards.items.forEach(rewardItem => {
                    addLog(`${allItems.find(i=>i.id === rewardItem.itemId)?.name} x${rewardItem.quantity} 획득!`, 'effect-message');
                    const itemInfo = allItems.find(i => i.id === rewardItem.itemId)!;
                    const existingItem = newInventory.find(i => i.id === itemInfo.id && !(i.enhancementLevel > 0));
                    if (existingItem) {
                        existingItem.quantity += rewardItem.quantity;
                    } else {
                        newInventory.push({ ...itemInfo, quantity: rewardItem.quantity });
                    }
                });
                return { ...prev, xp: finalXp, gold: finalGold, inventory: newInventory };
            });
            setTimeout(() => endDungeon(true), 2000);
        }
    }, [monster, currentStage, dungeon, addLog, setPlayerStats, endDungeon]);

    const handlePlayerDeath = useCallback(() => {
        addLog('던전 공략 실패...', 'system-message');
        setPlayerStats(prev => ({...prev, hp: 1}));
        setTimeout(() => endDungeon(false), 2000);
    }, [addLog, setPlayerStats, endDungeon]);

    const handleEnemyTurn = useCallback(() => {
        if (!monster) return;

        if (monster.statusEffects?.stun && monster.statusEffects.stun > 0) {
            addLog(`${monster.name}이(가) 기절해서 움직일 수 없다!`, 'system-message');
            setMonster(prev => ({...prev!, statusEffects: { stun: prev!.statusEffects!.stun - 1 }}));
            setIsPlayerTurn(true);
            return;
        }

        setEnemyAttacking(true);
        setTimeout(() => setEnemyAttacking(false), 400);

        let damage = Math.max(1, monster.attack - totalDefense);
        addLog(`${monster.name}의 공격! ${playerStats.playerName}에게 ${damage}의 피해를 입혔다.`, 'enemy-turn');
        addDamagePopup(String(damage), false, 'player');
        const newPlayerHp = playerStats.hp - damage;
        setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));
        if (newPlayerHp <= 0) {
            handlePlayerDeath();
        } else {
            setIsPlayerTurn(true);
        }
    }, [monster, playerStats, totalDefense, addLog, addDamagePopup, handlePlayerDeath, setPlayerStats]);

    const handlePlayerAction = (isAttack: boolean, damageDealt: number) => {
        if(!monster) return;
        const newMonsterHp = monster.hp - damageDealt;
        setMonster({ ...monster, hp: newMonsterHp });

        if (newMonsterHp <= 0) {
            handleMonsterDefeated();
        } else {
            if (isAttack) {
                 setUltimateCharge(prev => Math.min(5, prev + 1));
            }
            setIsPlayerTurn(false);
        }
    }

    const handlePlayerAttack = () => {
        if (!isPlayerTurn || !monster) return;
        setPlayerAttacking(true);
        setTimeout(() => setPlayerAttacking(false), 400);

        const weapon = playerStats.equipment.weapon;
        const accuracy = weapon?.accuracy || 0.9;
        let totalDamage = 0;

        if (Math.random() > accuracy) {
            addLog(`${playerStats.playerName}의 공격이 빗나갔다!`, 'player-turn');
        } else {
            const baseCritChance = playerStats.playerClass === 'Archer' ? PlayerClasses.Archer.bonuses.critChance : 0;
            const critChance = (weapon?.critChance || 0.05) + baseCritChance;
            const isCrit = Math.random() < critChance;
            const critMultiplier = weapon?.critDamageMultiplier || 1.5;
            let damage = totalAttack;
            damage = isCrit ? Math.floor(damage * critMultiplier) : damage;
            damage = Math.max(1, damage - monster.defense);
            
            addLog(`${playerStats.playerName}의 공격! ${monster.name}에게 ${damage}의 피해를 입혔다.${isCrit ? ' (치명타!)' : ''}`, 'player-turn');
            addDamagePopup(String(damage), isCrit, 'enemy');
            totalDamage += damage;
            
            const procChance = weapon?.procChance || 0;
            if (weapon && weapon.procDamage && Math.random() < procChance) {
                const procDamage = weapon.procDamage;
                 addLog(`${getDisplayName(weapon)}의 특수 효과 발동! ${procDamage}의 추가 피해!`, 'effect-message');
                 totalDamage += procDamage;
            }

            if (activePet && Math.random() < activePet.skillProcChance && activePet.skillEffect?.type === 'damage') {
                const petDamage = activePet.skillEffect.amount || 0;
                totalDamage += petDamage;
                addLog(`${activePet.name}의 스킬 '${activePet.skillName}'! ${petDamage}의 추가 피해!`, 'player-turn', true);
            }
        }
        
        handlePlayerAction(true, totalDamage);
    };

    const handleUsePotion = (itemToUse: Item & { quantity: number }) => {
        if (!isPlayerTurn || !monster) return;

        if (itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect!.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                
                addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 사용해 HP를 ${itemToUse.effect!.amount} 회복했다.`, 'player-turn');
                return { ...prev, hp: newHp, inventory: newInventory };
            });
            
            setShowInventory(false);
            setIsPlayerTurn(false);
        } else if (itemToUse.effect?.type === 'damage_enemy') {
            const damage = itemToUse.effect.amount;
            addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 던져 ${monster.name}에게 ${damage}의 피해를 입혔다!`, 'player-turn');
            addDamagePopup(String(damage), false, 'enemy');

            setPlayerStats(prev => {
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                return { ...prev, inventory: newInventory };
            });
            
            setShowInventory(false);
            handlePlayerAction(false, damage);
        }
    };
    
    const handleUseUltimate = () => {
        if (ultimateCharge < 5 || !isPlayerTurn || !monster) return;
        const playerClass = playerStats.playerClass || 'Adventurer';
        let damage = 0;
        let logMessage = '';

        if (playerClass === 'Warrior') {
            damage = Math.floor(totalAttack * 3);
            damage = Math.max(1, damage - monster.defense);
            if (Math.random() < 0.5) {
                setMonster(prev => ({...prev!, statusEffects: { stun: 1 }}));
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입히고 기절시켰다!`;
            } else {
                 logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입혔다!`;
            }
        } else if (playerClass === 'Archer') {
            const critMultiplier = (playerStats.equipment.weapon?.critDamageMultiplier || 1.5) * 2;
            damage = Math.floor(totalAttack * critMultiplier);
            damage = Math.max(1, damage - monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Archer.name}'! ${monster.name}에게 ${damage}의 치명적인 피해를 입혔다!`;
        } else {
            damage = Math.floor(totalAttack * 2.5);
            damage = Math.max(1, damage - monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Adventurer.name}'! ${monster.name}에게 ${damage}의 강력한 피해를 입혔다!`;
        }

        addLog(logMessage, 'player-turn');
        addDamagePopup(String(damage), true, 'enemy');
        setUltimateCharge(0);
        handlePlayerAction(false, damage);
    };

    useEffect(() => {
        if (!isPlayerTurn && monster && monster.hp > 0 && playerStats.hp > 0) {
            const timer = setTimeout(() => handleEnemyTurn(), 1000);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, monster, playerStats.hp, handleEnemyTurn]);

    if (!monster) return <div className="card">로딩 중...</div>;

    return (
        <div className="card">
            <h2>{dungeon.name} - 스테이지 {currentStage}/{dungeon.stages}</h2>
             {showInventory && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>아이템 사용</h3>
                        <div className="battle-inventory-list">
                            {playerConsumables.map(item => (
                                <div key={item.id} className="inventory-item">
                                    <span><strong className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)}</strong> (x{item.quantity})</span>
                                    <button onClick={() => handleUsePotion(item)}>사용</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowInventory(false)}>닫기</button>
                    </div>
                </div>
            )}
             <div className="combat-screen">
                 <div className={`character-container player-side ${playerAttacking ? 'attacking' : ''}`}>
                    <StatBar value={playerStats.hp} maxValue={playerStats.maxHp} color="#4caf50" label={playerStats.playerName} />
                    <span className="character">🧑‍🚀</span>
                     {activePet && <span className="pet-character">
                        {activePet.type === 'Griffin' ? '🦅' : activePet.type === 'Turtle' ? '🐢' : '🐲'}
                    </span>}
                    {damagePopups.filter(p => p.target === 'player').map(p => (
                        <div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>
                    ))}
                </div>
                <div className={`character-container enemy-side ${enemyAttacking ? 'attacking' : ''}`}>
                    <StatBar value={monster.hp} maxValue={monster.maxHp} color="#f44336" label={monster.name} />
                    <span className="character">{monster.emoji}</span>
                     {damagePopups.filter(p => p.target === 'enemy').map(p => (
                        <div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>
                    ))}
                </div>
            </div>
            
            <div className="battle-log" ref={el => el?.scrollTo(0, el.scrollHeight)}>
                {battleLog}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {monster.hp <= 0 || playerStats.hp <= 0 ? (
                    <p>다음으로 진행 중...</p>
                ) : (
                    <div className="battle-actions">
                        <button onClick={handlePlayerAttack} disabled={!isPlayerTurn}>공격</button>
                        <button onClick={() => setShowInventory(true)} disabled={!isPlayerTurn}>아이템</button>
                        <button onClick={handleUseUltimate} disabled={!isPlayerTurn || ultimateCharge < 5} className="ultimate-button">
                            궁극기 ({ultimateCharge}/5)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DungeonSelectionView = ({ setView, startDungeon }: {
    setView: (view: string) => void;
    startDungeon: (dungeon: Dungeon) => void;
}) => {
    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>던전 선택</h2>
            <div className="dungeon-list">
                {allDungeons.map(dungeon => (
                    <div key={dungeon.id} className="card dungeon-card">
                        <h3>{dungeon.name} (Lv.{dungeon.difficulty})</h3>
                        <p>{dungeon.description}</p>
                        <p>스테이지: {dungeon.stages}</p>
                        <div className="dungeon-card-rewards">
                            <strong>주요 보상:</strong>
                            <ul>
                                <li>{formatNumber(dungeon.rewards.gold)} G, {formatNumber(dungeon.rewards.xp)} XP</li>
                                {dungeon.rewards.items.map(item => (
                                    <li key={item.itemId}>{allItems.find(i => i.id === item.itemId)?.name} x{item.quantity}</li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={() => startDungeon(dungeon)}>입장</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BlacksmithView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {
    const [tab, setTab] = useState<'enhance' | 'craft'>('enhance');
    const [selectedItem, setSelectedItem] = useState<(Item & {quantity: number}) | null>(null);

    const handleEnhance = () => {
        if (!selectedItem) return;

        const level = selectedItem.enhancementLevel || 0;
        const cost = 100 * (level + 1);
        const materialCost = Math.ceil((level + 1) / 2);
        const magicStone = playerStats.inventory.find(i => i.id === 12);

        if (playerStats.gold < cost) {
            alert("골드가 부족합니다.");
            return;
        }
        if (!magicStone || magicStone.quantity < materialCost) {
            alert("마력의 돌이 부족합니다.");
            return;
        }

        const successChance = Math.max(0.1, 1 - (level * 0.08));
        
        setPlayerStats(prev => {
            const newInventory = [...prev.inventory];
            const stoneIndex = newInventory.findIndex(i => i.id === 12);
            newInventory[stoneIndex] = {...newInventory[stoneIndex], quantity: newInventory[stoneIndex].quantity - materialCost};

            if (Math.random() < successChance) {
                alert("강화에 성공했습니다!");
                const itemIndex = newInventory.findIndex(i => i.id === selectedItem.id && i.enhancementLevel === selectedItem.enhancementLevel);
                
                // create a new unique item instance for the enhanced item
                const enhancedItem = {
                    ...selectedItem,
                    enhancementLevel: level + 1,
                    quantity: 1,
                };
                
                if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex].quantity -= 1;
                    newInventory.push(enhancedItem);
                } else {
                    newInventory[itemIndex] = enhancedItem;
                }
                
                setSelectedItem(enhancedItem); // update selected item view
                
                 return { ...prev, gold: prev.gold - cost, inventory: newInventory.filter(i => i.quantity > 0) };

            } else {
                alert("강화에 실패했습니다...");
                 return { ...prev, gold: prev.gold - cost, inventory: newInventory.filter(i => i.quantity > 0) };
            }
        });
    };

    const handleCraft = (recipe: Recipe) => {
        // Check materials
        for (const mat of recipe.materials) {
            const playerMat = playerStats.inventory.find(i => i.id === mat.materialId);
            if (!playerMat || playerMat.quantity < mat.quantity) {
                alert(`${allMaterials.find(m => m.id === mat.materialId)?.name}이(가) 부족합니다.`);
                return;
            }
        }

        setPlayerStats(prev => {
            let newInventory = [...prev.inventory];

            // Consume materials
            recipe.materials.forEach(mat => {
                const matIndex = newInventory.findIndex(i => i.id === mat.materialId);
                newInventory[matIndex].quantity -= mat.quantity;
            });
            newInventory = newInventory.filter(i => i.quantity > 0);

            // Add result item
            const existingItem = newInventory.find(i => i.id === recipe.result.id && !i.enhancementLevel);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                newInventory.push({ ...recipe.result, quantity: 1 });
            }
            
            // Check for quest progress
            const updatedQuests = prev.activeQuests.map(quest => {
                if (!quest.isCompleted && quest.type === 'CRAFT_ITEM' && quest.targetId === recipe.result.id) {
                     return { ...quest, currentProgress: quest.currentProgress + 1 };
                }
                return quest;
            });

            return { ...prev, inventory: newInventory, activeQuests: updatedQuests };
        });

        alert(`${recipe.result.name} 제작에 성공했습니다!`);
    };

    const enhanceableItems = playerStats.inventory.filter(i => (i.type === ItemType.WEAPON || i.type === ItemType.ARMOR));

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>대장간</h2>
            <div className="shop-tabs">
                <button className={tab === 'enhance' ? 'active' : ''} onClick={() => { setTab('enhance'); setSelectedItem(null); }}>강화</button>
                <button className={tab === 'craft' ? 'active' : ''} onClick={() => { setTab('craft'); setSelectedItem(null); }}>제작</button>
            </div>
            {tab === 'enhance' ? (
                <div className="blacksmith-container">
                    <div className="item-list-panel">
                        <h3>강화할 아이템 선택</h3>
                        {enhanceableItems.map((item, index) => (
                            <div key={`${item.id}-${index}-${item.enhancementLevel || 0}`} 
                                 className={`list-item ${selectedItem === item ? 'selected' : ''}`}
                                 onClick={() => setSelectedItem(item)}>
                                <strong className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)}</strong>
                            </div>
                        ))}
                    </div>
                    <div>
                        {selectedItem ? (
                            <div className="card">
                                <h3>{getDisplayName(selectedItem)}</h3>
                                <div className="enhancement-stats">
                                    {selectedItem.damage && <p>공격력: {selectedItem.damage + ((selectedItem.enhancementLevel || 0) * 2)} <span className="arrow">→</span> {selectedItem.damage + ((selectedItem.enhancementLevel || 0) + 1) * 2}</p>}
                                    {selectedItem.defense && <p>방어력: {selectedItem.defense + (selectedItem.enhancementLevel || 0)} <span className="arrow">→</span> {selectedItem.defense + (selectedItem.enhancementLevel || 0) + 1}</p>}
                                </div>
                                <hr />
                                <p><strong>비용:</strong> {100 * ((selectedItem.enhancementLevel || 0) + 1)} G</p>
                                <p><strong>필요 재료:</strong> 마력의 돌 x{Math.ceil(((selectedItem.enhancementLevel || 0) + 1) / 2)}</p>
                                <p><strong>성공 확률:</strong> {Math.max(10, 100 - ((selectedItem.enhancementLevel || 0) * 8))}%</p>
                                <button onClick={handleEnhance}>강화</button>
                            </div>
                        ) : <p>강화할 아이템을 선택하세요.</p>}
                    </div>
                </div>
            ) : (
                 <div className="crafting-container">
                    {allRecipes.map(recipe => {
                        const canCraft = recipe.materials.every(mat => {
                            const playerMat = playerStats.inventory.find(i => i.id === mat.materialId);
                            return playerMat && playerMat.quantity >= mat.quantity;
                        });

                        return (
                            <div key={recipe.id} className="card" style={{marginBottom: '15px'}}>
                                <h3>{recipe.name}</h3>
                                <p>결과: <strong className={ItemGradeInfo[recipe.result.grade]?.class}>{recipe.result.name}</strong></p>
                                <ul className="material-list">
                                    <strong>필요 재료:</strong>
                                    {recipe.materials.map(mat => {
                                        const playerMat = playerStats.inventory.find(i => i.id === mat.materialId);
                                        const haveEnough = playerMat && playerMat.quantity >= mat.quantity;
                                        return (
                                            <li key={mat.materialId} className={haveEnough ? 'sufficient' : 'insufficient'}>
                                                {allMaterials.find(m => m.id === mat.materialId)?.name}: {mat.quantity} (보유: {playerMat?.quantity || 0})
                                            </li>
                                        );
                                    })}
                                </ul>
                                <button onClick={() => handleCraft(recipe)} disabled={!canCraft}>제작</button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const QuestBoardView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {

    const handleAcceptQuest = (questId: number) => {
        const questData = allQuests.find(q => q.id === questId);
        if (questData && playerStats.activeQuests.length < 5) {
            setPlayerStats(prev => ({
                ...prev,
                activeQuests: [...prev.activeQuests, { ...questData, currentProgress: 0, isCompleted: false }]
            }));
        } else if (playerStats.activeQuests.length >= 5) {
            alert("최대 5개의 퀘스트만 동시에 진행할 수 있습니다.");
        }
    };

    const handleClaimReward = (questId: number) => {
        const quest = playerStats.activeQuests.find(q => q.id === questId);
        if (!quest || !quest.isCompleted) return;
        
        alert(`퀘스트 '${quest.title}' 보상을 획득했습니다!`);

        setPlayerStats(prev => {
            let newGold = prev.gold + quest.rewards.gold;
            let newXp = prev.xp + quest.rewards.xp;
            let newInventory = [...prev.inventory];

            quest.rewards.items?.forEach(rewardItem => {
                const itemInfo = allItems.find(i => i.id === rewardItem.itemId);
                if (itemInfo) {
                    const existingItem = newInventory.find(i => i.id === itemInfo.id && !i.enhancementLevel);
                    if (existingItem) {
                        existingItem.quantity += rewardItem.quantity;
                    } else {
                        newInventory.push({ ...itemInfo, quantity: rewardItem.quantity });
                    }
                }
            });
            
            const townXpGained = Math.floor(quest.rewards.xp / 4);

            return {
                ...prev,
                gold: newGold,
                xp: newXp,
                inventory: newInventory,
                townXp: prev.townXp + townXpGained,
                activeQuests: prev.activeQuests.filter(q => q.id !== questId)
            };
        });
    };
    
    useEffect(() => {
        // Automatically mark quests as completed
        setPlayerStats(prev => {
            const updatedQuests = prev.activeQuests.map(quest => {
                if (!quest.isCompleted && quest.currentProgress >= quest.targetQuantity) {
                    return { ...quest, isCompleted: true };
                }
                return quest;
            });
            return { ...prev, activeQuests: updatedQuests };
        });
    }, [playerStats.activeQuests, setPlayerStats]);
    
    const availableQuests = allQuests.filter(q => !playerStats.activeQuests.some(aq => aq.id === q.id));

    return (
         <div className="card quest-board-container">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>퀘스트 게시판</h2>

            <div className="quest-section">
                <h3>진행 중인 퀘스트 ({playerStats.activeQuests.length}/5)</h3>
                {playerStats.activeQuests.length > 0 ? playerStats.activeQuests.map(quest => {
                    const progress = Math.min(quest.currentProgress, quest.targetQuantity);
                    return (
                        <div key={quest.id} className={`card quest-card ${quest.isCompleted ? 'completed' : ''}`}>
                            <div className="quest-info">
                                <h4>{quest.title}</h4>
                                <p>{quest.description}</p>
                                <div className="quest-progress-bar-container">
                                    <div className="quest-progress-bar-fill" style={{width: `${(progress / quest.targetQuantity) * 100}%`}}></div>
                                </div>
                                <span>{progress} / {quest.targetQuantity}</span>
                                <div className="quest-rewards">
                                    <strong>보상:</strong> {quest.rewards.gold} G, {quest.rewards.xp} XP
                                </div>
                            </div>
                            {quest.isCompleted && <button onClick={() => handleClaimReward(quest.id)}>보상 받기</button>}
                        </div>
                    );
                }) : <p>진행 중인 퀘스트가 없습니다.</p>}
            </div>

            <div className="quest-section">
                <h3>새로운 퀘스트</h3>
                {availableQuests.map(quest => (
                    <div key={quest.id} className="card quest-card">
                        <div className="quest-info">
                            <h4>{quest.title}</h4>
                            <p>{quest.description}</p>
                             <div className="quest-rewards">
                                <strong>보상:</strong> {quest.rewards.gold} G, {quest.rewards.xp} XP
                            </div>
                        </div>
                        <button onClick={() => handleAcceptQuest(quest.id)} disabled={playerStats.activeQuests.length >= 5}>수락</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GachaShrineView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {
    const [gachaResult, setGachaResult] = useState<GachaResult | null>(null);

    const performItemGacha = () => {
        if (playerStats.gold < ITEM_GACHA_COST) {
            alert("골드가 부족합니다.");
            return;
        }

        setPlayerStats(prev => ({...prev, gold: prev.gold - ITEM_GACHA_COST}));

        const rand = Math.random();
        let grade: string;
        if (rand < 0.01) grade = ItemGrade.LEGENDARY; // 1%
        else if (rand < 0.06) grade = ItemGrade.EPIC; // 5%
        else if (rand < 0.21) grade = ItemGrade.RARE; // 15%
        else if (rand < 0.51) grade = ItemGrade.UNCOMMON; // 30%
        else grade = ItemGrade.COMMON; // 49%

        const itemsOfGrade = allItems.filter(item => item.grade === grade && item.type !== ItemType.MATERIAL);
        const drawnItem = itemsOfGrade[Math.floor(Math.random() * itemsOfGrade.length)];

        setPlayerStats(prev => {
            const newInventory = [...prev.inventory];
            const existingItem = newInventory.find(i => i.id === drawnItem.id && !i.enhancementLevel);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                newInventory.push({ ...drawnItem, quantity: 1 });
            }
            return { ...prev, inventory: newInventory };
        });

        setGachaResult({ type: 'item', item: drawnItem });
    };
    
     const performPetGacha = () => {
        if (playerStats.gold < PET_GACHA_COST) {
            alert("골드가 부족합니다.");
            return;
        }

        setPlayerStats(prev => ({...prev, gold: prev.gold - PET_GACHA_COST}));
        
        const rand = Math.random();
        let grade: string;
        if (rand < 0.05) grade = ItemGrade.EPIC; // 5%
        else grade = ItemGrade.RARE; // 95%
        
        const petsOfGrade = allPets.filter(p => p.grade === grade);
        const drawnPetData = petsOfGrade[Math.floor(Math.random() * petsOfGrade.length)];
        const newPet: Pet = { ...drawnPetData, level: 1, xp: 0, xpToNextLevel: 100 };

        setPlayerStats(prev => ({ ...prev, pets: [...prev.pets, newPet]}));
        setGachaResult({ type: 'pet', pet: newPet });
    };


    return (
        <div className="card gacha-shrine">
            {gachaResult && (
                <div className="gacha-result" onClick={() => setGachaResult(null)}>
                    <div className="card">
                        <h2>획득!</h2>
                        {gachaResult.type === 'item' && gachaResult.item && <>
                            <p className={`gacha-item-grade ${ItemGradeInfo[gachaResult.item.grade]?.class}`}>{ItemGradeInfo[gachaResult.item.grade]?.name}</p>
                            <p className="gacha-item-name">{gachaResult.item.name}</p>
                        </>}
                         {gachaResult.type === 'pet' && gachaResult.pet && <>
                            <p className={`gacha-item-grade ${ItemGradeInfo[gachaResult.pet.grade]?.class}`}>{ItemGradeInfo[gachaResult.pet.grade]?.name}</p>
                            <p className="gacha-item-name">{gachaResult.pet.name}</p>
                        </>}
                        <button onClick={() => setGachaResult(null)}>확인</button>
                    </div>
                </div>
            )}
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>뽑기 성소</h2>
            <p>운명을 시험하고 강력한 아이템과 반려동물을 얻으세요!</p>
            <div className="gacha-buttons-container">
                <button className="gacha-button" onClick={performItemGacha} disabled={playerStats.gold < ITEM_GACHA_COST}>
                    아이템 뽑기<br/>({formatNumber(ITEM_GACHA_COST)} G)
                </button>
                 <button className="gacha-button pet-gacha-button" onClick={performPetGacha} disabled={playerStats.gold < PET_GACHA_COST}>
                    반려동물 뽑기<br/>({formatNumber(PET_GACHA_COST)} G)
                </button>
            </div>
        </div>
    );
};

const TownHallView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {
    const currentLevelIndex = playerStats.townLevel - 1;
    const currentLevelInfo = townLevels[currentLevelIndex];
    const nextLevelInfo = townLevels[currentLevelIndex + 1];

    const isMaxLevel = !nextLevelInfo || nextLevelInfo.costToUpgrade === Infinity;

    // XP bar calculation
    const baseXpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpNeededForNextLevel = isMaxLevel ? baseXpForCurrentLevel : nextLevelInfo.xpRequired;
    const xpProgressInCurrentLevel = playerStats.townXp - baseXpForCurrentLevel;
    const xpRangeForCurrentLevel = xpNeededForNextLevel - baseXpForCurrentLevel;

    const canUpgrade = !isMaxLevel && 
                       playerStats.gold >= currentLevelInfo.costToUpgrade && 
                       playerStats.townXp >= nextLevelInfo.xpRequired;

    const handleUpgrade = () => {
        if (!canUpgrade) {
             if (playerStats.townXp < nextLevelInfo.xpRequired) {
                alert("마을 경험치가 부족합니다.");
            } else if (playerStats.gold < currentLevelInfo.costToUpgrade) {
                alert("업그레이드 비용이 부족합니다.");
            }
            return;
        }

        setPlayerStats(prev => {
            alert(`마을을 Lv.${prev.townLevel + 1} ${nextLevelInfo.name}(으)로 업그레이드했습니다!`);
            return {
                ...prev,
                gold: prev.gold - currentLevelInfo.costToUpgrade,
                townLevel: prev.townLevel + 1,
            };
        });
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>마을 회관</h2>
            <h3>현재 마을: Lv.{playerStats.townLevel} {currentLevelInfo.name}</h3>

            {isMaxLevel ? (
                <p>마을이 최고 레벨에 도달했습니다!</p>
            ) : (
                <div className="town-hall-content">
                    <StatBar 
                        value={xpProgressInCurrentLevel > 0 ? xpProgressInCurrentLevel : 0} 
                        maxValue={xpRangeForCurrentLevel > 0 ? xpRangeForCurrentLevel : 1} 
                        color="#03dac6" 
                        label={`마을 XP`} 
                    />
                     <div className="town-hall-upgrade-info">
                        <h4>다음 레벨: Lv.{playerStats.townLevel + 1} {nextLevelInfo.name}</h4>
                        <p>필요 총 경험치: {formatNumber(nextLevelInfo.xpRequired)} (현재: {formatNumber(playerStats.townXp)})</p>
                        <p>업그레이드 비용: {formatNumber(currentLevelInfo.costToUpgrade)} G</p>
                        <button onClick={handleUpgrade} disabled={!canUpgrade}>
                            업그레이드
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrophyRoadView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {

    const handleClaimReward = (milestoneIndex: number) => {
        const milestone = trophyRoadMilestones[milestoneIndex];
        if (playerStats.trophies < milestone.trophies || playerStats.claimedTrophyRewards.includes(milestoneIndex)) {
            return;
        }

        setPlayerStats(prev => {
            let newGold = prev.gold;
            let newInventory = [...prev.inventory];

            if (milestone.rewards.gold) {
                newGold += milestone.rewards.gold;
            }
            if (milestone.rewards.items) {
                 milestone.rewards.items.forEach(rewardItem => {
                    const itemInfo = allItems.find(i => i.id === rewardItem.itemId);
                    if(itemInfo) {
                        const existingItem = newInventory.find(i => i.id === itemInfo.id && !i.enhancementLevel);
                        if (existingItem) existingItem.quantity += rewardItem.quantity;
                        else newInventory.push({ ...itemInfo, quantity: rewardItem.quantity });
                    }
                 });
            }
            return {
                ...prev,
                gold: newGold,
                inventory: newInventory,
                claimedTrophyRewards: [...prev.claimedTrophyRewards, milestoneIndex]
            };
        });
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>트로피 로드</h2>
            <p className="current-trophies">현재 트로피: {formatNumber(playerStats.trophies)} 🏆</p>
            <div className="trophy-road-container">
                {trophyRoadMilestones.map((milestone, index) => {
                    const isUnlocked = playerStats.trophies >= milestone.trophies;
                    const isClaimed = playerStats.claimedTrophyRewards.includes(index);
                    return (
                        <div key={index} className={`trophy-milestone ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''}`}>
                            <div>
                                <h4>{milestone.trophies} 🏆</h4>
                                <div>
                                    {milestone.rewards.gold && <p>골드: {formatNumber(milestone.rewards.gold)}</p>}
                                    {milestone.rewards.items?.map(item => (
                                        <p key={item.itemId}>{allItems.find(i => i.id === item.itemId)?.name} x{item.quantity}</p>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => handleClaimReward(index)} disabled={!isUnlocked || isClaimed}>
                                {isClaimed ? '획득 완료' : '보상 받기'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PetsView = ({ playerStats, setPlayerStats, setView }: {
    playerStats: PlayerStats;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    setView: (view: string) => void;
}) => {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    useEffect(() => {
        if (playerStats.pets.length > 0 && !selectedPet) {
            setSelectedPet(playerStats.pets[0]);
        }
    }, [playerStats.pets, selectedPet]);

    const handleSetActivePet = (petId: number) => {
        setPlayerStats(prev => ({ ...prev, activePetId: petId }));
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>반려동물</h2>
            {playerStats.pets.length === 0 ? (
                <p>보유한 반려동물이 없습니다. 뽑기 성소에서 새로운 친구를 만나보세요!</p>
            ) : (
                <div className="pet-management-view">
                    <div className="pet-list-container">
                        <h3>나의 반려동물</h3>
                        <div className="pet-list">
                            {playerStats.pets.map(pet => (
                                <div key={pet.id} className={`pet-card ${selectedPet?.id === pet.id ? 'active' : ''}`} onClick={() => setSelectedPet(pet)}>
                                    <strong className={ItemGradeInfo[pet.grade]?.class}>{pet.name}</strong>
                                    <span> (Lv.{pet.level})</span>
                                    {playerStats.activePetId === pet.id && ' ✅'}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pet-details-container card">
                        {selectedPet ? (
                            <>
                                <h3>{selectedPet.name} <span className={ItemGradeInfo[selectedPet.grade]?.class}>({ItemGradeInfo[selectedPet.grade]?.name})</span></h3>
                                <p>레벨: {selectedPet.level}</p>
                                <StatBar value={selectedPet.xp} maxValue={selectedPet.xpToNextLevel} color="#fbc02d" label="XP" />
                                <p>공격력 보너스: +{selectedPet.attackBonus}</p>
                                <p>방어력 보너스: +{selectedPet.defenseBonus}</p>
                                <hr />
                                <h4>스킬: {selectedPet.skillName}</h4>
                                <p>{selectedPet.skillDescription}</p>
                                <button onClick={() => handleSetActivePet(selectedPet.id)} disabled={playerStats.activePetId === selectedPet.id}>
                                    {playerStats.activePetId === selectedPet.id ? '활성화됨' : '활성화'}
                                </button>
                            </>
                        ) : <p>반려동물을 선택하세요.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [view, setView] = useState(View.TOWN);
    const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);

    useEffect(() => {
        const savedData = localStorage.getItem('playerStats');
        if (savedData) {
            setPlayerStats(JSON.parse(savedData));
        } else {
            setPlayerStats(getInitialPlayerStats());
        }
    }, []);

    useEffect(() => {
        if (playerStats) {
            localStorage.setItem('playerStats', JSON.stringify(playerStats));
        }
    }, [playerStats]);

    // Full HP recovery in town
    useEffect(() => {
        if (view === View.TOWN) {
            setPlayerStats(prev => {
                if (prev && prev.hp < prev.maxHp) {
                    return { ...prev, hp: prev.maxHp };
                }
                return prev;
            });
        }
    }, [view]);
    
    const resetGame = () => {
        if (confirm("정말로 모든 진행 상황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            localStorage.removeItem('playerStats');
            setPlayerStats(getInitialPlayerStats());
            setView(View.TOWN);
        }
    };
    
    const startDungeon = (dungeon: Dungeon) => {
        if (!playerStats) return;

        let finalDungeon = { ...dungeon };
        // 플레이어 레벨이 10 미만이면 던전 가디언(id: 4)을 오크(id: 3)로 교체합니다.
        if (playerStats.level < 10) {
            finalDungeon.monsters = dungeon.monsters.map(monsterId => monsterId === 4 ? 3 : monsterId);
        }
        
        setSelectedDungeon(finalDungeon);
        setView(View.DUNGEON_BATTLE);
    };

    const renderView = () => {
        if (!playerStats) return <div>게임 불러오는 중...</div>;

        switch (view) {
            case View.TOWN:
                return <TownView playerStats={playerStats} setView={setView} />;
            case View.PLAYER:
                return <PlayerStatsView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.SHOP:
                return <ShopView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.BATTLE:
                return <BattleView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.CLASS_SELECTION:
                 return <ClassSelectionView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.DUNGEON:
                return <DungeonSelectionView setView={setView} startDungeon={startDungeon} />;
            case View.DUNGEON_BATTLE:
                return <DungeonBattleView dungeon={selectedDungeon!} playerStats={playerStats} setPlayerStats={setPlayerStats} endDungeon={() => { setView(View.TOWN); }} />;
            case View.BLACKSMITH:
                return <BlacksmithView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.QUEST_BOARD:
                return <QuestBoardView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.GACHA_SHRINE:
                return <GachaShrineView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.TOWN_HALL:
                return <TownHallView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.TROPHY_ROAD:
                return <TrophyRoadView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.PETS:
                 return <PetsView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            default:
                return <TownView playerStats={playerStats} setView={setView} />;
        }
    };

    return (
        <>
            {renderView()}
            <button onClick={resetGame} style={{ marginTop: '20px', backgroundColor: '#555' }}>게임 초기화</button>
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);