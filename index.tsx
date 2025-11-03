import React, { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES & CONSTANTS ---
const ItemType = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    PET_ARMOR: 'PetArmor',
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
    LEGENDARY: 'LEGENDARY',
    MYTHIC: 'MYTHIC',
    SECRET: 'SECRET',
    ULTIMATE: 'ULTIMATE',
};

const ItemGradeInfo = {
    [ItemGrade.COMMON]: { name: '일반', color: '#ffffff', class: 'grade-common', order: 1 },
    [ItemGrade.UNCOMMON]: { name: '고급', color: '#1eff00', class: 'grade-uncommon', order: 2 },
    [ItemGrade.RARE]: { name: '희귀', color: '#0070dd', class: 'grade-rare', order: 3 },
    [ItemGrade.EPIC]: { name: '영웅', color: '#a335ee', class: 'grade-epic', order: 4 },
    [ItemGrade.LEGENDARY]: { name: '전설', color: '#ff8000', class: 'grade-legendary', order: 5 },
    [ItemGrade.MYTHIC]: { name: '신화', color: '#00ffff', class: 'grade-mythic', order: 6 },
    [ItemGrade.SECRET]: { name: '시크릿', color: '#ff00ff', class: 'grade-secret', order: 7 },
    [ItemGrade.ULTIMATE]: { name: '궁극', color: '#ff0000', class: 'grade-ultimate', order: 8 },
};

const PlayerClasses = {
    Warrior: { name: '전사', description: '강인한 체력과 방어력을 가집니다. (최대 HP +20, 방어력 +5)', bonuses: { maxHp: 20, defense: 5, attack: 0 } },
    Archer: { name: '궁수', description: '높은 공격력과 치명타 확률을 자랑합니다. (공격력 +5, 치명타 확률 +5%)', bonuses: { attack: 5, critChance: 0.05, maxHp: 0, defense: 0 } },
    Magician: { name: '마법사', description: '마력을 다루어 강력한 원소 공격을 합니다. (공격력 +7, 최대 HP -10)', bonuses: { attack: 7, maxHp: -10, defense: 0 } },
};

const UltimateSkills = {
    Adventurer: { name: '파워 스트라이크', description: '적에게 250%의 피해를 입힙니다.' },
    Warrior: { name: '분쇄의 일격', description: '적에게 300%의 피해를 입히고 50% 확률로 1턴 동안 기절시킵니다.' },
    Archer: { name: '저격', description: '반드시 치명타로 적중하는 강력한 화살을 발사합니다. (기본 치명타 피해량의 200%)' },
    Magician: { name: '메테오', description: '거대한 운석을 떨어트려 적에게 400%의 막대한 피해를 입힙니다.' }
};

const PET_GACHA_COST = 500;
const ITEM_GACHA_COST = 300;

const allPets = [
    { id: 1, name: '그리핀 주니어', type: 'Griffin', grade: ItemGrade.RARE, attackBonus: 5, defenseBonus: 0, skillName: '할퀴기', skillDescription: '15% 확률로 추가 피해를 입힙니다.', skillProcChance: 0.15, skillEffect: { type: 'damage', amount: 10 }, sellPrice: 100 },
    { id: 2, name: '돌북이', type: 'Turtle', grade: ItemGrade.RARE, attackBonus: 0, defenseBonus: 8, skillName: '단단해지기', skillDescription: '전투 시작 시 방어력이 10% 증가합니다.', skillProcChance: 1.0, sellPrice: 100 },
    { id: 3, name: '아기용', type: 'Dragon', grade: ItemGrade.EPIC, attackBonus: 10, defenseBonus: 5, skillName: '작은 불씨', skillDescription: '20% 확률로 강력한 화염 피해를 입힙니다.', skillProcChance: 0.20, skillEffect: { type: 'damage', amount: 25 }, sellPrice: 300 },
    { id: 4, name: '불사조', type: 'Phoenix', grade: ItemGrade.LEGENDARY, attackBonus: 25, defenseBonus: 10, skillName: '영원의 불꽃', skillDescription: '30% 확률로 영원의 불꽃을 발사하여 강력한 추가 피해를 입힙니다.', skillProcChance: 0.30, skillEffect: { type: 'damage', amount: 75 }, sellPrice: 1000 },
];


// --- DATABASE ---
const allItems = [
    // --- 기존 아이템 ---
    { id: 1, type: ItemType.WEAPON, name: '나무 몽둥이', price: 15, grade: ItemGrade.COMMON, damage: 3, accuracy: 0.8, description: '흔한 나무 몽둥이입니다.' },
    { id: 2, type: ItemType.WEAPON, name: '낡은 검', price: 60, grade: ItemGrade.COMMON, damage: 5, accuracy: 0.9, description: '가장 기본적인 검입니다. 없는 것보단 낫습니다.' },
    { id: 3, type: ItemType.WEAPON, name: '강철 검', price: 300, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, critChance: 0.05, critDamageMultiplier: 1.5, description: '잘 벼려진 강철 검입니다.' },
    { id: 4, type: ItemType.ARMOR, name: '가죽 갑옷', price: 120, grade: ItemGrade.UNCOMMON, defense: 5, description: '질긴 가죽으로 만든 갑옷입니다.' },
    { id: 5, type: ItemType.CONSUMABLE, name: '하급 체력 물약', price: 20, grade: ItemGrade.COMMON, effect: { type: 'heal', amount: 20 }, description: 'HP를 20 회복합니다.' },
    { id: 6, type: ItemType.MATERIAL, name: '철광석', price: 10, grade: ItemGrade.COMMON, description: '강철을 만드는 데 사용되는 기본적인 광물입니다.' },
    { id: 7, type: ItemType.MATERIAL, name: '가죽', price: 8, grade: ItemGrade.COMMON, description: '동물에게서 얻을 수 있는 질긴 가죽입니다.' },
    { id: 8, type: ItemType.WEAPON, name: '지휘관의 창', price: 2000, grade: ItemGrade.EPIC, damage: 25, accuracy: 0.95, critChance: 0.1, critDamageMultiplier: 1.8, procChance: 0.1, procDamage: 10, description: '전장을 지휘하는 지휘관의 창. 10% 확률로 추가 피해를 입힙니다.' },
    { id: 9, type: ItemType.ARMOR, name: '강철 갑옷', price: 650, grade: ItemGrade.RARE, defense: 15, description: '견고한 강철로 만들어진 갑옷입니다.' },
    { id: 10, type: ItemType.WEAPON, name: '엘프의 활', price: 2400, grade: ItemGrade.EPIC, weaponType: 'Bow', damage: 22, accuracy: 1.1, critChance: 0.15, critDamageMultiplier: 2.0, description: '신비로운 힘이 깃든 엘프의 활. 명중률이 매우 높습니다.' },
    { id: 11, type: ItemType.WEAPON, name: '천공의 분노', price: 12500, grade: ItemGrade.LEGENDARY, damage: 50, accuracy: 0.9, critChance: 0.2, critDamageMultiplier: 2.5, description: '하늘의 분노를 담은 전설적인 검입니다.' },
    { id: 12, type: ItemType.MATERIAL, name: '마력의 돌', price: 100, grade: ItemGrade.RARE, description: '신비한 마력이 깃든 돌. 강화에 사용됩니다.' },

    // --- 기존 확장 아이템 ---
    { id: 13, type: ItemType.WEAPON, name: '단검', price: 50, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.95, critChance: 0.05, critDamageMultiplier: 1.6, description: '빠른 공격이 가능한 작은 검입니다.' },
    { id: 14, type: ItemType.WEAPON, name: '글라디우스', price: 75, grade: ItemGrade.COMMON, damage: 6, accuracy: 0.9, description: '로마 병사들이 사용하던 짧은 검입니다.' },
    { id: 15, type: ItemType.WEAPON, name: '손도끼', price: 55, grade: ItemGrade.COMMON, damage: 5, accuracy: 0.85, description: '한 손으로 다루기 쉬운 도끼입니다.' },
    { id: 16, type: ItemType.WEAPON, name: '쿼터스태프', price: 45, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.9, description: '단단한 나무로 만든 긴 지팡이입니다.' },
    { id: 17, type: ItemType.WEAPON, name: '망치', price: 20, grade: ItemGrade.COMMON, damage: 4, accuracy: 0.75, description: '평범한 망치입니다.' },
    { id: 18, type: ItemType.WEAPON, name: '아이언 액스', price: 330, grade: ItemGrade.UNCOMMON, damage: 12, accuracy: 0.85, description: '묵직한 철제 도끼입니다.' },
    { id: 19, type: ItemType.WEAPON, name: '숏보우', price: 270, grade: ItemGrade.UNCOMMON, weaponType: 'Bow', damage: 8, accuracy: 1.0, critChance: 0.1, critDamageMultiplier: 1.6, description: '다루기 쉬운 짧은 활입니다.' },
    { id: 20, type: ItemType.WEAPON, name: '롱소드', price: 375, grade: ItemGrade.UNCOMMON, damage: 11, accuracy: 0.9, critChance: 0.05, critDamageMultiplier: 1.5, description: '균형 잡힌 장검입니다.' },
    { id: 21, type: ItemType.WEAPON, name: '스피어', price: 315, grade: ItemGrade.UNCOMMON, damage: 9, accuracy: 0.95, description: '긴 사정거리를 가진 창입니다.' },
    { id: 22, type: ItemType.WEAPON, name: '시미터', price: 360, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, critChance: 0.08, critDamageMultiplier: 1.6, description: '아름다운 곡선 형태의 검입니다.' },
    { id: 23, type: ItemType.WEAPON, name: '쇠뇌', price: 450, grade: ItemGrade.UNCOMMON, weaponType: 'Bow', damage: 14, accuracy: 0.8, description: '강력하지만 장전이 느린 쇠뇌입니다.' },
    { id: 24, type: ItemType.WEAPON, name: '메이스', price: 345, grade: ItemGrade.UNCOMMON, damage: 10, accuracy: 0.9, description: '둔기류 무기입니다.' },
    { id: 25, type: ItemType.WEAPON, name: '브로드소드', price: 1260, grade: ItemGrade.RARE, damage: 18, accuracy: 0.9, description: '넓은 칼날을 가진 위력적인 검입니다.' },
    { id: 26, type: ItemType.WEAPON, name: '미스릴 단검', price: 1530, grade: ItemGrade.RARE, damage: 15, accuracy: 1.0, critChance: 0.15, critDamageMultiplier: 1.8, description: '가볍고 날카로운 미스릴 단검입니다.' },
    { id: 27, type: ItemType.WEAPON, name: '워해머', price: 1620, grade: ItemGrade.RARE, damage: 22, accuracy: 0.8, description: '적의 방어구를 부수는 육중한 망치입니다.' },
    { id: 28, type: ItemType.WEAPON, name: '그레이트소드', price: 1440, grade: ItemGrade.RARE, damage: 20, accuracy: 0.85, description: '양손으로 사용하는 거대한 검입니다.' },
    { id: 29, type: ItemType.WEAPON, name: '롱보우', price: 1350, grade: ItemGrade.RARE, weaponType: 'Bow', damage: 16, accuracy: 1.0, critChance: 0.12, critDamageMultiplier: 1.7, description: '먼 거리의 적을 저격하는 장궁입니다.' },
    { id: 30, type: ItemType.WEAPON, name: '모닝스타', price: 1470, grade: ItemGrade.RARE, damage: 19, accuracy: 0.88, procChance: 0.15, procDamage: 8, description: '철퇴 끝에 가시가 박혀있습니다. 15% 확률로 추가 피해를 입힙니다.' },
    { id: 31, type: ItemType.WEAPON, name: '클레이모어', price: 1530, grade: ItemGrade.RARE, damage: 21, accuracy: 0.8, description: '스코틀랜드의 양손 검입니다.' },
    { id: 32, type: ItemType.WEAPON, name: '기사의 검', price: 3000, grade: ItemGrade.EPIC, damage: 30, accuracy: 0.95, critChance: 0.1, critDamageMultiplier: 1.7, description: '왕국을 수호하는 기사에게 주어지는 검입니다.' },
    { id: 33, type: ItemType.WEAPON, name: '암살자의 칼날', price: 3600, grade: ItemGrade.EPIC, damage: 25, accuracy: 1.1, critChance: 0.25, critDamageMultiplier: 2.2, description: '어둠 속에서 적의 심장을 노리는 칼날입니다.' },
    { id: 34, type: ItemType.WEAPON, name: '룬 블레이드', price: 3200, grade: ItemGrade.EPIC, damage: 28, accuracy: 0.9, procChance: 0.1, procDamage: 15, description: '고대 룬 문자가 새겨져 마법의 힘을 발휘합니다. 10% 확률로 마법 피해를 입힙니다.' },
    { id: 35, type: ItemType.WEAPON, name: '카타나', price: 3400, grade: ItemGrade.EPIC, damage: 26, accuracy: 1.0, critChance: 0.2, critDamageMultiplier: 2.0, description: '동방의 장인이 만든 예리한 도입니다.' },
    { id: 36, type: ItemType.WEAPON, name: '핼버드', price: 3100, grade: ItemGrade.EPIC, damage: 32, accuracy: 0.85, description: '창과 도끼를 합친 형태의 강력한 폴암입니다.' },
    { id: 37, type: ItemType.WEAPON, name: '건블레이드', price: 3800, grade: ItemGrade.EPIC, weaponType: 'Gun', damage: 27, accuracy: 0.95, critChance: 0.15, critDamageMultiplier: 1.8, description: '총과 검이 결합된 하이브리드 무기입니다.' },
    { id: 38, type: ItemType.WEAPON, name: '엑스칼리버', price: 25000, grade: ItemGrade.LEGENDARY, damage: 60, accuracy: 1.0, critChance: 0.2, critDamageMultiplier: 2.5, procChance: 0.2, procDamage: 30, description: '선택받은 왕의 전설적인 성검. 20% 확률로 신성한 빛의 추가 피해를 입힙니다.' },
    { id: 39, type: ItemType.WEAPON, name: '드래곤 슬레이어', price: 20000, grade: ItemGrade.LEGENDARY, damage: 70, accuracy: 0.85, description: '용의 비늘마저 꿰뚫는 거대한 대검입니다.' },
    { id: 40, type: ItemType.WEAPON, name: '스톰브링어', price: 21250, grade: ItemGrade.LEGENDARY, weaponType: 'Bow', damage: 55, accuracy: 1.2, critChance: 0.25, critDamageMultiplier: 2.2, description: '폭풍의 힘을 담아 번개의 화살을 쏘는 활입니다.' },
    { id: 41, type: ItemType.WEAPON, name: '게이볼그', price: 22500, grade: ItemGrade.LEGENDARY, damage: 65, accuracy: 0.95, critChance: 0.15, critDamageMultiplier: 2.0, procChance: 0.3, procDamage: 25, description: '던지면 반드시 심장을 꿰뚫는다는 저주받은 마창. 30% 확률로 출혈 피해를 입힙니다.' },
    { id: 42, type: ItemType.WEAPON, name: '섀도우팽', price: 23750, grade: ItemGrade.LEGENDARY, damage: 50, accuracy: 1.1, critChance: 0.3, critDamageMultiplier: 2.8, description: '그림자에서 벼려낸 단검. 치명타에 특화되어 있습니다.' },
    { id: 43, type: ItemType.ARMOR, name: '천 갑옷', price: 30, grade: ItemGrade.COMMON, defense: 2, description: '가장 기본적인 천 갑옷입니다.' },
    { id: 44, type: ItemType.ARMOR, name: '사슬 갑옷', price: 300, grade: ItemGrade.UNCOMMON, defense: 8, description: '작은 고리를 엮어 만든 갑옷입니다.' },
    { id: 45, type: ItemType.ARMOR, name: '플레이트 아머', price: 1500, grade: ItemGrade.RARE, defense: 20, description: '전신을 감싸는 판금 갑옷입니다.' },
    { id: 46, type: ItemType.ARMOR, name: '기사의 갑옷', price: 3000, grade: ItemGrade.EPIC, defense: 35, description: '고위 기사들이 입는 견고한 갑옷입니다.' },
    { id: 47, type: ItemType.ARMOR, name: '용비늘 갑옷', price: 7500, grade: ItemGrade.LEGENDARY, defense: 50, description: '용의 비늘로 만들어져 마법과 화염에 강한 저항력을 가집니다.' },
    { id: 50, type: ItemType.CONSUMABLE, name: '중급 체력 물약', price: 50, grade: ItemGrade.UNCOMMON, effect: { type: 'heal', amount: 50 }, description: 'HP를 50 회복합니다.' },
    { id: 51, type: ItemType.CONSUMABLE, name: '상급 체력 물약', price: 120, grade: ItemGrade.RARE, effect: { type: 'heal', amount: 150 }, description: 'HP를 150 회복합니다.' },
    { id: 52, type: ItemType.CONSUMABLE, name: '독극물 병', price: 80, grade: ItemGrade.UNCOMMON, effect: { type: 'damage_enemy', amount: 30 }, description: '적에게 30의 독 피해를 입힙니다.' },
    { id: 53, type: ItemType.CONSUMABLE, name: '화염병', price: 150, grade: ItemGrade.RARE, effect: { type: 'damage_enemy', amount: 70 }, description: '적에게 70의 화염 피해를 입힙니다.' },
    { id: 54, type: ItemType.CONSUMABLE, name: '신성한 성수', price: 300, grade: ItemGrade.EPIC, effect: { type: 'damage_enemy', amount: 150 }, description: '언데드에게 특히 강력한 신성한 피해를 150 입힙니다.' },
    { id: 55, type: ItemType.WEAPON, name: '낡은 권총', price: 85, grade: ItemGrade.COMMON, damage: 6, accuracy: 0.95, weaponType: 'Gun', description: '기본적인 반자동 권총입니다.' },
    { id: 56, type: ItemType.WEAPON, name: '펌프 액션 샷건', price: 420, grade: ItemGrade.UNCOMMON, damage: 15, accuracy: 0.75, weaponType: 'Gun', description: '근거리에서 강력한 위력을 발휘하는 산탄총입니다.' },
    { id: 57, type: ItemType.WEAPON, name: '기관단총', price: 480, grade: ItemGrade.UNCOMMON, damage: 9, accuracy: 0.9, weaponType: 'Gun', procChance: 0.15, procDamage: 4, description: '빠른 연사력을 자랑합니다. 15% 확률로 추가 사격을 합니다.' },
    { id: 58, type: ItemType.WEAPON, name: '돌격소총', price: 1580, grade: ItemGrade.RARE, damage: 19, accuracy: 0.9, weaponType: 'Gun', description: '안정적이고 균형 잡힌 자동소총입니다.' },
    { id: 59, type: ItemType.WEAPON, name: 'AWP 저격소총', price: 4000, grade: ItemGrade.EPIC, damage: 35, accuracy: 0.9, weaponType: 'Gun', critChance: 0.3, critDamageMultiplier: 2.5, description: '한 발에 모든 것을 거는 강력한 저격소총. 치명타 확률이 매우 높습니다.' },
    { id: 60, type: ItemType.WEAPON, name: '경기관총', price: 3900, grade: ItemGrade.EPIC, damage: 28, accuracy: 0.8, weaponType: 'Gun', description: '묵직한 화력으로 적을 제압하는 기관총입니다.' },
    { id: 61, type: ItemType.WEAPON, name: '미니건', price: 23000, grade: ItemGrade.LEGENDARY, damage: 58, accuracy: 0.75, weaponType: 'Gun', procChance: 0.4, procDamage: 15, description: '분당 수천 발의 탄환을 쏟아붓는 파괴의 화신. 40% 확률로 추가 피해를 입힙니다.' },
    { id: 62, type: ItemType.WEAPON, name: '황금 총', price: 30000, grade: ItemGrade.LEGENDARY, damage: 77, accuracy: 1.0, weaponType: 'Gun', critChance: 0.5, critDamageMultiplier: 3.0, description: '모든 것을 한 방에 끝내는 전설의 황금 총. 명중률과 치명타율이 경이롭습니다.' },
    { id: 63, type: ItemType.WEAPON, name: '심판자의 철퇴', price: 24500, grade: ItemGrade.LEGENDARY, damage: 70, accuracy: 0.9, critChance: 0.1, critDamageMultiplier: 2.0, procChance: 0.2, procDamage: 110, description: '적을 심판하는 육중한 철퇴. 20% 확률로 정의의 힘이 발동하여 110의 추가 신성 피해를 입힙니다.' },
    { id: 64, type: ItemType.ARMOR, name: '미스릴 셔츠', price: 900, grade: ItemGrade.RARE, defense: 18, description: '가볍고 튼튼한 미스릴로 짠 셔츠입니다.' },
    { id: 65, type: ItemType.ARMOR, name: '그림자 로브', price: 2800, grade: ItemGrade.EPIC, defense: 32, description: '어둠에 몸을 숨기기 좋은 로브. 약간의 마법 저항력도 있습니다.' },
    { id: 66, type: ItemType.ARMOR, name: '수호자의 갑옷', price: 7000, grade: ItemGrade.LEGENDARY, defense: 48, description: '고대 수호자들의 힘이 깃든 갑옷입니다.' },
    { id: 67, type: ItemType.CONSUMABLE, name: '최상급 체력 물약', price: 250, grade: ItemGrade.EPIC, effect: { type: 'heal', amount: 300 }, description: 'HP를 300 회복합니다.' },
    { id: 68, type: ItemType.CONSUMABLE, name: '엘릭서', price: 2000, grade: ItemGrade.LEGENDARY, effect: { type: 'heal', amount: 9999 }, description: 'HP를 완전히 회복시킵니다.' },
    { id: 69, type: ItemType.CONSUMABLE, name: '강력한 화염병', price: 400, grade: ItemGrade.EPIC, effect: { type: 'damage_enemy', amount: 120 }, description: '적에게 120의 강력한 화염 피해를 입힙니다.' },
    { id: 70, type: ItemType.CONSUMABLE, name: '직업 변경 메달리온', price: 10000, grade: ItemGrade.EPIC, effect: { type: 'job_change' }, description: '사용 시 현재 직업을 초기화하고 새로운 직업을 선택할 수 있습니다.' },
    // --- 신화 등급 무기 ---
    { id: 71, type: ItemType.WEAPON, name: '태초의 불꽃', price: 250000, grade: ItemGrade.MYTHIC, damage: 150, accuracy: 1.0, critChance: 0.25, critDamageMultiplier: 3.0, procChance: 0.3, procDamage: 100, description: '세상을 창조한 불꽃의 정수가 담긴 대검. 30% 확률로 모든 것을 태우는 화염을 방출합니다.' },
    { id: 72, type: ItemType.WEAPON, name: '시간 왜곡의 칼날', price: 300000, grade: ItemGrade.MYTHIC, damage: 120, accuracy: 1.2, critChance: 0.5, critDamageMultiplier: 3.5, description: '시간의 흐름을 베어버리는 단검. 경이로운 치명타 능력으로 적을 소멸시킵니다.' },
    { id: 73, type: ItemType.WEAPON, name: '은하수 파괴자', price: 280000, grade: ItemGrade.MYTHIC, damage: 180, accuracy: 0.85, weaponType: 'Gun', description: '별을 꿰뚫는 힘을 지닌 저격소총. 압도적인 파괴력을 자랑합니다.' },
    { id: 74, type: ItemType.WEAPON, name: '세계수의 가지', price: 270000, grade: ItemGrade.MYTHIC, damage: 130, accuracy: 1.1, weaponType: 'Bow', procChance: 0.5, procDamage: 80, description: '세계수의 힘이 깃든 활. 50% 확률로 자연의 정령들이 공격을 돕습니다.' },
    { id: 75, type: ItemType.WEAPON, name: '종말의 망치', price: 260000, grade: ItemGrade.MYTHIC, damage: 200, accuracy: 0.8, description: '세상의 종말을 가져온다는 거대한 망치. 모든 것을 평등하게 파괴합니다.' },
    // --- 신화 등급 방어구 ---
    { id: 76, type: ItemType.ARMOR, name: '천상의 흉갑', price: 200000, grade: ItemGrade.MYTHIC, defense: 100, description: '신들의 대장장이가 별빛으로 벼려낸 흉갑입니다. 모든 종류의 피해를 막아냅니다.' },
    { id: 77, type: ItemType.ARMOR, name: '타이탄의 갑주', price: 240000, grade: ItemGrade.MYTHIC, defense: 120, description: '고대 타이탄의 힘이 깃든 갑옷. 입는 자에게 산과 같은 굳건함을 부여합니다.' },
    { id: 78, type: ItemType.ARMOR, name: '공허의 그림자 갑옷', price: 220000, grade: ItemGrade.MYTHIC, defense: 90, description: '공허의 힘으로 짜여진 갑옷. 그림자처럼 적의 공격을 흘려보냅니다.' },
    { id: 79, type: ItemType.ARMOR, name: '생명의 드래곤하트 아머', price: 230000, grade: ItemGrade.MYTHIC, defense: 110, description: '고대 용의 심장이 박힌 갑옷. 강력한 생명력으로 착용자를 보호합니다.' },
    // --- 신규 제작 아이템 ---
    { id: 80, type: ItemType.MATERIAL, name: '심연의 파편', price: 50000, grade: ItemGrade.MYTHIC, description: '나락의 군주의 힘이 응축된 파편. 신화 장비를 제작하는 데 사용됩니다.' },
    { id: 81, type: ItemType.ARMOR, name: '심연을 걷는 자의 갑주', price: 400000, grade: ItemGrade.MYTHIC, defense: 180, description: '나락의 힘을 제어하는 자만이 입을 수 있는 갑옷. 착용자를 모든 위협으로부터 보호합니다.' },
    // --- 시크릿 등급 무기 ---
    { id: 82, type: ItemType.WEAPON, name: '궁극의 지배자', price: 1000000, grade: ItemGrade.SECRET, damage: 300, accuracy: 1.1, critChance: 0.4, critDamageMultiplier: 4.0, procChance: 0.5, procDamage: 200, description: '모든 것을 지배하는 자의 검. 50% 확률로 차원의 균열을 열어 추가 피해를 입힙니다.' },
    { id: 83, type: ItemType.WEAPON, name: '아카식 레코드', price: 1200000, grade: ItemGrade.SECRET, damage: 250, accuracy: 1.5, weaponType: 'Bow', critChance: 0.6, critDamageMultiplier: 5.0, description: '세상의 모든 지식이 담긴 활. 모든 공격이 약점을 꿰뚫습니다.' },
    { id: 84, type: ItemType.WEAPON, name: '카오스 이레이저', price: 1100000, grade: ItemGrade.SECRET, damage: 350, accuracy: 0.9, weaponType: 'Gun', description: '존재 자체를 소멸시키는 총. 막대한 파괴력을 가집니다.' },
    // --- 시크릿 등급 방어구 ---
    { id: 85, type: ItemType.ARMOR, name: '절대자의 가호', price: 800000, grade: ItemGrade.SECRET, defense: 250, description: '어떠한 공격도 막아내는 신의 가호가 깃든 갑옷입니다.' },
    { id: 86, type: ItemType.ARMOR, name: '시간 여행자의 외투', price: 900000, grade: ItemGrade.SECRET, defense: 220, description: '시간의 흐름 속에서 단련된 외투. 입는 자를 인과율로부터 보호합니다.' },
    // --- 펫 방어구 ---
    { id: 87, type: ItemType.PET_ARMOR, name: '가죽 펫 갑옷', price: 150, grade: ItemGrade.COMMON, defense: 3, description: '반려동물을 위한 기본적인 가죽 갑옷.' },
    { id: 88, type: ItemType.PET_ARMOR, name: '강철 펫 흉갑', price: 500, grade: ItemGrade.UNCOMMON, defense: 8, description: '튼튼한 강철로 만들어진 펫 흉갑.' },
    { id: 89, type: ItemType.PET_ARMOR, name: '미스릴 펫 체인', price: 2000, grade: ItemGrade.RARE, defense: 15, description: '가볍고 견고한 미스릴 펫 갑옷.' },
    // --- 궁극 등급 아이템 ---
    { id: 90, type: ItemType.WEAPON, name: '오메가 블레이드', price: 4500000, grade: ItemGrade.ULTIMATE, damage: 380, accuracy: 1.2, critChance: 0.5, critDamageMultiplier: 4.5, procChance: 0.6, procDamage: 250, description: '존재의 법칙을 초월한 검. 모든 것을 무로 되돌립니다. 60% 확률로 절대적인 힘을 방출합니다.' },
    { id: 91, type: ItemType.WEAPON, name: '싱귤래리티 캐논', price: 5000000, grade: ItemGrade.ULTIMATE, weaponType: 'Gun', damage: 400, accuracy: 1.0, description: '블랙홀의 힘을 응축하여 발사하는 총. 그 무엇도 피할 수 없습니다.' },
    { id: 92, type: ItemType.WEAPON, name: '별의 종언', price: 4800000, grade: ItemGrade.ULTIMATE, weaponType: 'Bow', damage: 350, accuracy: 1.8, critChance: 0.8, critDamageMultiplier: 6.0, description: '별들의 마지막 빛으로 만든 활. 화살은 시공간을 꿰뚫습니다.' },
    { id: 93, type: ItemType.ARMOR, name: '시공간의 갑주', price: 3800000, grade: ItemGrade.ULTIMATE, defense: 300, description: '시간과 공간의 경계에서 벼려낸 갑옷. 모든 물리 법칙을 무시합니다.' },
];

const allMaterials = [
    { id: 6, name: '철광석', description: '강철을 만드는 데 사용되는 기본적인 광물입니다.' },
    { id: 7, name: '가죽', description: '동물에게서 얻을 수 있는 질긴 가죽입니다.' },
    { id: 12, name: '마력의 돌', description: '신비한 마력이 깃든 돌. 강화에 사용됩니다.' },
];

const allRecipes = [
    { id: 1, name: '강철 검 제작', result: allItems.find(item => item.id === 3), materials: [{ materialId: 6, quantity: 5 }], requiredCraftingLevel: 1 },
    { id: 2, name: '가죽 갑옷 제작', result: allItems.find(item => item.id === 4), materials: [{ materialId: 7, quantity: 10 }], requiredCraftingLevel: 1 },
    { id: 3, name: '플레이트 아머 제작', result: allItems.find(item => item.id === 45), materials: [{ materialId: 6, quantity: 20 }, { materialId: 12, quantity: 5 }], requiredCraftingLevel: 5 },
    { id: 4, name: '심연을 걷는 자의 갑주 제작', result: allItems.find(item => item.id === 81), materials: [{ materialId: 80, quantity: 5 }, { materialId: 12, quantity: 200 }], requiredCraftingLevel: 20 }
];

const allMonsters = [
    { id: 1, name: '슬라임', hp: 25, maxHp: 25, attack: 12, defense: 0, xp: 5, gold: 10, drops: [{ itemId: 7, chance: 0.1, quantity: 1 }], emoji: '🦠' },
    { id: 2, name: '고블린', hp: 40, maxHp: 40, attack: 18, defense: 2, xp: 10, gold: 20, drops: [{ itemId: 2, chance: 0.05, quantity: 1 }], emoji: '👺' },
    { id: 3, name: '오크', hp: 60, maxHp: 60, attack: 25, defense: 3, xp: 20, gold: 40, drops: [{ itemId: 3, chance: 0.02, quantity: 1 }], emoji: '👹' },
    { id: 4, name: '던전 가디언', hp: 170, maxHp: 170, attack: 38, defense: 7, xp: 100, gold: 200, drops: [{ itemId: 12, chance: 0.5, quantity: 2 }], emoji: '🤖' },
    { id: 101, name: '해골 기사', hp: 80, maxHp: 80, attack: 32, defense: 8, xp: 30, gold: 60, drops: [{ itemId: 9, chance: 0.05, quantity: 1 }], emoji: '💀' },
    { id: 102, name: '오우거', hp: 105, maxHp: 105, attack: 44, defense: 5, xp: 50, gold: 100, drops: [{ itemId: 27, chance: 0.03, quantity: 1 }], emoji: '🦍' },
    { id: 103, name: '리치', hp: 130, maxHp: 130, attack: 56, defense: 10, xp: 80, gold: 150, drops: [{ itemId: 34, chance: 0.02, quantity: 1 }], emoji: '🧙' },
    { id: 104, name: '새끼용', hp: 325, maxHp: 325, attack: 75, defense: 18, xp: 300, gold: 500, drops: [{ itemId: 47, chance: 0.1, quantity: 1 }], emoji: '🐉' },
    // 신규 몬스터
    { id: 201, name: '지옥의 군주', hp: 1300, maxHp: 1300, attack: 150, defense: 40, xp: 2000, gold: 5000, drops: [{ itemId: 12, chance: 1, quantity: 15 }], emoji: '😈' },
    { id: 202, name: '고대 골렘', hp: 1950, maxHp: 1950, attack: 125, defense: 80, xp: 2500, gold: 6000, drops: [{ itemId: 12, chance: 1, quantity: 20 }], emoji: '🗿' },
    { id: 203, name: '심연의 감시자', hp: 1560, maxHp: 1560, attack: 188, defense: 30, xp: 3000, gold: 7000, drops: [{ itemId: 12, chance: 1, quantity: 25 }], emoji: '👁️' },
    // 초고난도 몬스터
    { id: 301, name: '차원의 그림자', hp: 5200, maxHp: 5200, attack: 850, defense: 150, xp: 25000, gold: 50000, drops: [{ itemId: 12, chance: 1, quantity: 50 }], emoji: '👻' },
    { id: 302, name: '혼돈의 화신', hp: 8000, maxHp: 8000, attack: 1050, defense: 220, xp: 40000, gold: 80000, drops: [{ itemId: 12, chance: 1, quantity: 75 }], emoji: '🌀' },
    { id: 303, name: '태초의 존재', hp: 16000, maxHp: 16000, attack: 1250, defense: 300, xp: 100000, gold: 200000, drops: [{ itemId: 12, chance: 1, quantity: 150 }], emoji: '🌌' },
    { id: 304, name: '나락의 군주, 아자토스', hp: 25000, maxHp: 25000, attack: 1600, defense: 350, xp: 200000, gold: 500000, drops: [{ itemId: 80, chance: 1, quantity: 1 }], emoji: '🐙' }
];

const allDungeons = [
    { id: 0, name: '슬라임 굴', description: '가장 약한 슬라임들이 모여있는 동굴입니다. 모험의 첫걸음으로 안성맞춤입니다.', difficulty: 1, stages: 10, monsters: [1, 1, 1, 1, 2, 1, 1, 2, 1, 2], rewards: { xp: 200, gold: 300, items: [{ itemId: 43, quantity: 1 }] } },
    { id: 1, name: '고블린 동굴', description: '초보 모험가에게 적합한 동굴입니다. 고블린들이 서식하고 있습니다.', difficulty: 2, stages: 10, monsters: [2, 2, 2, 3, 2, 3, 2, 3, 3, 3], rewards: { xp: 600, gold: 1200, items: [{ itemId: 3, quantity: 1 }, { itemId: 12, quantity: 5 }] } },
    { id: 2, name: '오크의 전초기지', description: '강력한 오크들이 지키고 있는 전초기지입니다. 단단히 준비해야 합니다.', difficulty: 3, stages: 10, monsters: [3, 3, 3, 3, 3, 4, 3, 4, 3, 4], rewards: { xp: 2500, gold: 5000, items: [{ itemId: 9, quantity: 1 }, { itemId: 12, quantity: 15 }] } },
    { id: 3, name: '잊혀진 지하묘지', description: '언데드들이 배회하는 위험한 지하묘지입니다. 강력한 해골 기사와 오우거가 등장합니다.', difficulty: 4, stages: 10, monsters: [3, 101, 3, 101, 4, 101, 102, 101, 4, 102], rewards: { xp: 5000, gold: 10000, items: [{ itemId: 46, quantity: 1 }, { itemId: 12, quantity: 20 }] } },
    { id: 4, name: '용의 둥지', description: '전설 속 용이 잠들어 있다는 둥지. 강력한 몬스터들과 리치, 그리고... 새끼용이 당신을 기다립니다.', difficulty: 5, stages: 10, monsters: [102, 4, 102, 103, 4, 103, 102, 103, 103, 104], rewards: { xp: 12000, gold: 10000, items: [{ itemId: 38, quantity: 1 }] } },
    { id: 5, name: '불타는 심연', description: '지옥의 불길이 타오르는 끔찍한 공간입니다. 지옥의 군주가 지배하고 있습니다.', difficulty: 7, stages: 15, monsters: [103, 104, 103, 104, 103, 104, 103, 104, 103, 104, 103, 104, 103, 104, 201], rewards: { xp: 50000, gold: 100000, items: [{ itemId: 12, quantity: 50 }] } },
    { id: 6, name: '고대 골렘의 무덤', description: '잠들어 있는 거인을 깨우지 마십시오. 엄청난 방어력을 가진 고대 골렘이 버티고 있습니다.', difficulty: 8, stages: 15, monsters: [4, 102, 4, 102, 4, 102, 4, 102, 4, 102, 4, 102, 4, 102, 202], rewards: { xp: 60000, gold: 120000, items: [{ itemId: 12, quantity: 70 }] } },
    { id: 7, name: '혼돈의 차원', description: '시공간이 뒤틀린 미지의 공간. 예측할 수 없는 심연의 감시자가 당신을 노립니다.', difficulty: 9, stages: 15, monsters: [104, 103, 104, 103, 104, 103, 104, 103, 104, 103, 104, 103, 104, 103, 203], rewards: { xp: 80000, gold: 150000, items: [{ itemId: 12, quantity: 100 }] } },
    { id: 8, name: '신들의 무덤', description: '고대 신들이 잠들어 있는 곳. 신화적인 존재들이 당신의 자격을 시험합니다.', difficulty: 10, stages: 20, monsters: [201, 202, 201, 202, 201, 202, 201, 202, 201, 202, 203, 201, 203, 202, 203, 201, 203, 202, 203, 203], rewards: { xp: 200000, gold: 500000, items: [{ itemId: 72, quantity: 1 }] } },
    { id: 9, name: '태초의 균열', description: '세계가 시작된 혼돈의 균열. 상상조차 할 수 없는 힘이 도사리고 있습니다.', difficulty: 11, stages: 20, monsters: [202, 203, 202, 203, 202, 203, 202, 203, 202, 203, 201, 202, 201, 203, 201, 202, 201, 203, 201, 201], rewards: { xp: 350000, gold: 800000, items: [{ itemId: 73, quantity: 1 }] } },
    { id: 10, name: '차원 너머의 심연', description: '우주의 끝, 모든 법칙이 무너지는 곳. 형용할 수 없는 공포가 도사리고 있습니다.', difficulty: 12, stages: 25, monsters: [201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 203], rewards: { xp: 500000, gold: 1200000, items: [{ itemId: 75, quantity: 1 }] } },
    { id: 11, name: '수정 동굴', description: '반짝이는 수정 속에서 고대의 골렘들이 깨어납니다.', difficulty: 13, stages: 15, monsters: [103, 202, 103, 202, 103, 202, 103, 202, 103, 202, 103, 202, 103, 202, 202], rewards: { xp: 150000, gold: 250000, items: [{ itemId: 12, quantity: 150 }] } },
    { id: 12, name: '번개치는 첨탑', description: '폭풍의 중심에 있는 첨탑. 번개처럼 빠른 공격을 피해야 합니다.', difficulty: 14, stages: 15, monsters: [103, 203, 103, 203, 103, 203, 103, 203, 103, 203, 103, 203, 103, 203, 203], rewards: { xp: 180000, gold: 300000, items: [{ itemId: 12, quantity: 200 }] } },
    { id: 13, name: '얼어붙은 왕좌', description: '죽음의 한기가 서린 곳. 언데드의 군주가 당신을 기다립니다.', difficulty: 15, stages: 15, monsters: [101, 103, 101, 103, 201, 101, 103, 201, 101, 103, 201, 101, 103, 201, 201], rewards: { xp: 220000, gold: 400000, items: [{ itemId: 63, quantity: 1 }] } },
    { id: 14, name: '시간의 미궁', description: '과거와 미래가 뒤엉킨 미로. 모든 강적들이 당신을 시험합니다.', difficulty: 16, stages: 20, monsters: [201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 203], rewards: { xp: 280000, gold: 550000, items: [{ itemId: 12, quantity: 300 }] } },
    { id: 15, name: '별의 요람', description: '별들이 태어나는 장소. 우주의 질서를 지키는 감시자가 있습니다.', difficulty: 17, stages: 20, monsters: [203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203, 203], rewards: { xp: 350000, gold: 700000, items: [{ itemId: 74, quantity: 1 }] } },
    { id: 16, name: '악몽의 근원', description: '모든 공포가 시작되는 곳. 지옥의 군주들이 당신의 정신을 파괴하려 합니다.', difficulty: 18, stages: 20, monsters: [201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201], rewards: { xp: 420000, gold: 900000, items: [{ itemId: 71, quantity: 1 }] } },
    { id: 17, name: '세계의 척추', description: '세상을 떠받치는 거대한 산맥. 고대의 골렘들이 영원한 잠을 지키고 있습니다.', difficulty: 19, stages: 20, monsters: [202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202], rewards: { xp: 500000, gold: 1100000, items: [{ itemId: 76, quantity: 1 }] } },
    { id: 18, name: '창조주의 용광로', description: '세상이 만들어진 태초의 불꽃. 모든 것을 녹여버릴 듯한 열기가 가득합니다.', difficulty: 20, stages: 25, monsters: [201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201], rewards: { xp: 700000, gold: 1500000, items: [{ itemId: 77, quantity: 1 }] } },
    { id: 19, name: '무한의 도서관', description: '모든 지식과 역사가 기록된 곳. 기록의 수호자들이 침입자를 용서하지 않습니다.', difficulty: 21, stages: 30, monsters: [203, 203, 203, 203, 203, 201, 201, 201, 201, 201, 202, 202, 202, 202, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 201, 202, 203, 203, 203], rewards: { xp: 1000000, gold: 2500000, items: [{ itemId: 78, quantity: 1 }] } },
    { id: 20, name: '태초의 성역', description: '모든 존재의 근원, 우주의 법칙이 태어나고 소멸하는 곳. 신을 초월한 자만이 발을 들일 수 있습니다.', difficulty: 25, stages: 25, monsters: [201, 202, 203, 301, 201, 202, 203, 301, 201, 202, 203, 301, 302, 301, 302, 301, 302, 301, 302, 301, 302, 301, 302, 302, 303], rewards: { xp: 2500000, gold: 5000000, items: [{ itemId: 79, quantity: 1 }] } },
    { id: 21, name: '무한의 나락', description: '모든 빛이 사라지고 오직 순수한 공포만이 존재하는 차원의 끝자락. 돌아온 자는 아무도 없습니다.', difficulty: 30, stages: 30, monsters: [301, 301, 302, 301, 302, 201, 202, 203, 301, 303, 301, 302, 301, 302, 303, 301, 302, 301, 302, 303, 301, 302, 301, 302, 303, 301, 302, 303, 303, 304], rewards: { xp: 5000000, gold: 10000000, items: [{ itemId: 80, quantity: 1 }] } },
    { id: 22, name: '별빛의 회랑', description: '영롱한 별빛이 가득하지만, 그 그림자 속에는 차원을 삼키는 공포가 도사립니다.', difficulty: 32, stages: 30, monsters: [301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 303, 303, 304], rewards: { xp: 6000000, gold: 12000000, items: [{ itemId: 80, quantity: 2 }] } },
    { id: 23, name: '영겁의 감옥', description: '시간마저 멈춘 듯한 감옥. 이곳에 갇힌 태초의 존재들이 자유를 갈망하며 울부짖습니다.', difficulty: 34, stages: 30, monsters: [302, 302, 303, 302, 302, 303, 302, 302, 303, 302, 302, 303, 302, 302, 303, 302, 302, 303, 302, 302, 303, 302, 302, 303, 303, 303, 303, 303, 304, 304], rewards: { xp: 7500000, gold: 15000000, items: [{ itemId: 80, quantity: 3 }] } },
    { id: 24, name: '잊혀진 신들의 정원', description: '한때 신들이 거닐던 정원은 이제 혼돈의 화신들이 차지했습니다.', difficulty: 36, stages: 30, monsters: [301, 301, 301, 302, 302, 302, 303, 303, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 304, 304, 304], rewards: { xp: 9000000, gold: 18000000, items: [{ itemId: 76, quantity: 1 }] } },
    { id: 25, name: '칠흑의 왕좌', description: '어둠보다 깊은 어둠 속, 나락의 군주가 당신의 도전을 기다립니다.', difficulty: 38, stages: 35, monsters: [303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 301, 302, 303, 301, 302, 303, 301, 302, 303, 301, 302, 303, 304, 304, 304], rewards: { xp: 11000000, gold: 22000000, items: [{ itemId: 80, quantity: 5 }] } },
    { id: 26, name: '혼돈의 소용돌이', description: '모든 것이 뒤섞이고 파괴되는 혼돈의 중심. 질서는 존재하지 않습니다.', difficulty: 40, stages: 35, monsters: [301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 304, 304, 304], rewards: { xp: 13000000, gold: 26000000, items: [{ itemId: 77, quantity: 1 }] } },
    { id: 27, name: '시간 포식자의 둥지', description: '과거와 미래, 그리고 현재가 공존하는 곳. 시간을 지배하는 자만이 살아남습니다.', difficulty: 42, stages: 35, monsters: [303, 303, 303, 303, 304, 303, 303, 303, 303, 304, 303, 303, 303, 303, 304, 303, 303, 303, 303, 304, 303, 303, 303, 303, 304, 303, 303, 303, 303, 304, 304, 304, 304, 304, 304], rewards: { xp: 15000000, gold: 30000000, items: [{ itemId: 80, quantity: 8 }] } },
    { id: 28, name: '악몽의 현실', description: '당신의 가장 깊은 공포가 현실이 되어 눈앞에 나타납니다.', difficulty: 44, stages: 35, monsters: [301, 301, 301, 301, 301, 302, 302, 302, 302, 302, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 18000000, gold: 36000000, items: [{ itemId: 78, quantity: 1 }] } },
    { id: 29, name: '공허의 핵', description: '모든 것이 시작되고 끝나는 지점. 존재와 비존재의 경계가 무너집니다.', difficulty: 46, stages: 40, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 302, 302, 302, 302, 302, 301, 301, 301, 301, 301, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 22000000, gold: 44000000, items: [{ itemId: 80, quantity: 10 }] } },
    { id: 30, name: '부서진 하늘', description: '신들의 전쟁으로 산산조각 난 하늘. 그 파편 속에서 고대의 힘이 깨어납니다.', difficulty: 48, stages: 40, monsters: [301, 303, 301, 303, 301, 303, 301, 303, 301, 303, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 304, 304, 304, 304], rewards: { xp: 26000000, gold: 52000000, items: [{ itemId: 71, quantity: 1 }] } },
    { id: 31, name: '창조의 근원', description: '모든 생명이 시작된 곳. 하지만 지금은 파괴의 힘만이 남아있습니다.', difficulty: 50, stages: 40, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 30000000, gold: 60000000, items: [{ itemId: 80, quantity: 15 }] } },
    { id: 32, name: '운명의 실타래', description: '모든 존재의 운명이 엮여있는 곳. 실을 끊는 순간, 모든 것이 사라집니다.', difficulty: 52, stages: 40, monsters: [301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 301, 304, 304, 304, 304, 304], rewards: { xp: 35000000, gold: 70000000, items: [{ itemId: 72, quantity: 1 }] } },
    { id: 33, name: '침묵의 바다', description: '어떠한 소리도 존재하지 않는 심해. 오직 심연의 괴물들만이 존재를 알립니다.', difficulty: 54, stages: 40, monsters: [302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 302, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 40000000, gold: 80000000, items: [{ itemId: 80, quantity: 20 }] } },
    { id: 34, name: '핏빛 사막', description: '패배한 신들의 피로 물든 사막. 모래알 하나하나가 원한을 품고 있습니다.', difficulty: 56, stages: 40, monsters: [303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 45000000, gold: 90000000, items: [{ itemId: 73, quantity: 1 }] } },
    { id: 35, name: '만년빙벽', description: '세상의 끝에 위치한 거대한 얼음벽. 그 너머에는 무엇이 있을지 아무도 모릅니다.', difficulty: 58, stages: 45, monsters: [303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 50000000, gold: 100000000, items: [{ itemId: 80, quantity: 25 }] } },
    { id: 36, name: '그림자 첨탑', description: '하늘에 닿을 듯 솟아있는 검은 첨탑. 빛이 닿지 않는 곳에서 어둠이 태어납니다.', difficulty: 60, stages: 45, monsters: [301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 55000000, gold: 110000000, items: [{ itemId: 74, quantity: 1 }] } },
    { id: 37, name: '잿빛 황무지', description: '모든 것이 불타버리고 재만 남은 땅. 생명의 흔적은 찾아볼 수 없습니다.', difficulty: 62, stages: 45, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 302, 302, 302, 302, 302, 301, 301, 301, 301, 301, 304, 304, 304, 304, 304], rewards: { xp: 60000000, gold: 120000000, items: [{ itemId: 80, quantity: 30 }] } },
    { id: 38, name: '저주받은 왕국', description: '탐욕으로 몰락한 고대 왕국. 왕과 신하들은 영원히 이곳을 떠돌고 있습니다.', difficulty: 64, stages: 45, monsters: [301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 301, 302, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 65000000, gold: 130000000, items: [{ itemId: 75, quantity: 1 }] } },
    { id: 39, name: '신성 모독의 제단', description: '신을 부정하는 자들이 세운 금단의 제단. 불경한 힘이 당신을 시험합니다.', difficulty: 66, stages: 45, monsters: [304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 70000000, gold: 140000000, items: [{ itemId: 80, quantity: 40 }] } },
    { id: 40, name: '꿈의 잔해', description: '누군가 꾸었던 거대한 꿈의 파편. 비논리적인 법칙이 지배하는 세계입니다.', difficulty: 68, stages: 50, monsters: [301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 75000000, gold: 150000000, items: [{ itemId: 81, quantity: 1 }] } },
    { id: 41, name: '왜곡된 낙원', description: '겉보기에는 아름다운 낙원. 하지만 그 이면에는 끔찍한 진실이 숨어있습니다.', difficulty: 70, stages: 50, monsters: [301, 301, 301, 301, 301, 301, 301, 301, 301, 301, 302, 302, 302, 302, 302, 302, 302, 302, 302, 302, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 80000000, gold: 160000000, items: [{ itemId: 80, quantity: 50 }] } },
    { id: 42, name: '종말의 전조', description: '세계가 끝나는 날의 풍경. 모든 것이 무로 돌아가기 직전의 순간입니다.', difficulty: 72, stages: 50, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 302, 302, 302, 302, 302, 301, 301, 301, 301, 301, 304, 304, 304, 304, 304], rewards: { xp: 85000000, gold: 170000000, items: [{ itemId: 76, quantity: 1 }, { itemId: 77, quantity: 1 }] } },
    { id: 43, name: '무한의 계단', description: '오르고 또 올라도 끝이 보이지 않는 계단. 포기하는 순간, 당신의 존재는 소멸합니다.', difficulty: 75, stages: 50, monsters: [301, 301, 302, 302, 303, 303, 304, 304, 301, 301, 302, 302, 303, 303, 304, 304, 301, 301, 302, 302, 303, 303, 304, 304, 301, 301, 302, 302, 303, 303, 304, 304, 301, 301, 302, 302, 303, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 90000000, gold: 180000000, items: [{ itemId: 80, quantity: 60 }] } },
    { id: 44, name: '별을 삼킨 자의 무덤', description: '한때 우주를 위협했던 존재가 잠들어 있는 곳. 그의 남은 힘만으로도 세계를 파괴할 수 있습니다.', difficulty: 78, stages: 50, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 100000000, gold: 200000000, items: [{ itemId: 78, quantity: 1 }, { itemId: 79, quantity: 1 }] } },
    { id: 45, name: '신의 눈물', description: '창조주가 흘린 눈물 한 방울이 만들어낸 작은 우주. 그 안에는 슬픔과 분노만이 가득합니다.', difficulty: 81, stages: 50, monsters: [303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 303, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 120000000, gold: 240000000, items: [{ itemId: 80, quantity: 80 }] } },
    { id: 46, name: '존재의 끝', description: '모든 것이 사라진 후의 세계. 당신은 마지막 남은 존재입니까, 아니면 첫 번째 존재입니까?', difficulty: 85, stages: 50, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 150000000, gold: 300000000, items: [{ itemId: 80, quantity: 100 }] } },
    { id: 47, name: '절대자의 영역', description: '이 게임의 법칙을 초월한 존재가 머무는 곳. 당신의 모든 데이터가 그의 손에 달려있습니다.', difficulty: 90, stages: 50, monsters: [304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 200000000, gold: 400000000, items: [{ itemId: 71, quantity: 1 }, { itemId: 76, quantity: 1 }] } },
    { id: 48, name: '환장 그 자체', description: '설명이 필요한가요? 이 던전은 그냥... 환장합니다.', difficulty: 95, stages: 50, monsters: [301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 301, 302, 303, 304, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 303, 302, 301, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304, 304], rewards: { xp: 250000000, gold: 500000000, items: [{ itemId: 80, quantity: 150 }] } },
    { id: 49, name: '개발자의 책상', description: '버그와 마감일, 그리고 끝없는 커피... 이 게임에서 가장 무서운 곳입니다. [개발자가 당신을 지켜보고 있습니다.]', difficulty: 100, stages: 1, monsters: [304], rewards: { xp: 999999999, gold: 999999999, items: [{ itemId: 81, quantity: 1 }] } }
];

const allQuests = [
    { id: 1, title: '초보 사냥꾼', description: '슬라임을 5마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 1, targetQuantity: 5, rewards: { xp: 50, gold: 100 }, requiredLevel: 1 },
    { id: 2, title: '가죽 수집', description: '가죽을 10개 모으세요.', type: 'COLLECT_ITEM', targetId: 7, targetQuantity: 10, rewards: { xp: 30, gold: 150 }, requiredLevel: 1 },
    { id: 3, title: '첫 번째 제작', description: '강철 검을 1개 제작하세요.', type: 'CRAFT_ITEM', targetId: 3, targetQuantity: 1, rewards: { xp: 100, gold: 200, items: [{ itemId: 12, quantity: 2 }] }, requiredLevel: 2 },
    { id: 4, title: '슬라임 박멸', description: '슬라임을 50마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 1, targetQuantity: 50, rewards: { xp: 200, gold: 500 }, requiredLevel: 3 },
    { id: 5, title: '고블린 소탕 작전', description: '고블린을 30마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 2, targetQuantity: 30, rewards: { xp: 300, gold: 700 }, requiredLevel: 5 },
    { id: 6, title: '오크와의 전면전', description: '오크를 20마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 3, targetQuantity: 20, rewards: { xp: 500, gold: 1000 }, requiredLevel: 8 },
    { id: 7, title: '언데드 정화', description: '해골 기사를 10마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 101, targetQuantity: 10, rewards: { xp: 800, gold: 1500 }, requiredLevel: 10 },
    { id: 8, title: '거인의 위협', description: '오우거를 5마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 102, targetQuantity: 5, rewards: { xp: 1000, gold: 2000 }, requiredLevel: 12 },
    { id: 9, title: '광물 전문가', description: '철광석을 30개 모으세요.', type: 'COLLECT_ITEM', targetId: 6, targetQuantity: 30, rewards: { xp: 150, gold: 300 }, requiredLevel: 4 },
    { id: 10, title: '마법의 근원', description: '마력의 돌을 20개 모으세요.', type: 'COLLECT_ITEM', targetId: 12, targetQuantity: 20, rewards: { xp: 400, gold: 800, items: [{ itemId: 51, quantity: 2 }] }, requiredLevel: 10 },
    { id: 11, title: '대장장이의 길', description: '강철 검을 5개 제작하세요.', type: 'CRAFT_ITEM', targetId: 3, targetQuantity: 5, rewards: { xp: 500, gold: 1000 }, requiredLevel: 8 },
    { id: 12, title: '견고한 방어', description: '플레이트 아머를 1개 제작하세요.', type: 'CRAFT_ITEM', targetId: 45, targetQuantity: 1, rewards: { xp: 1200, gold: 2500 }, requiredLevel: 15 },
    { id: 13, title: '고블린 동굴 정복', description: '고블린 동굴을 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 1, targetQuantity: 1, rewards: { xp: 1000, gold: 2000 }, requiredLevel: 7 },
    { id: 14, title: '오크 전초기지 파괴', description: '오크의 전초기지를 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 2, targetQuantity: 1, rewards: { xp: 3000, gold: 6000 }, requiredLevel: 12 },
    { id: 15, title: '지하묘지의 안식', description: '잊혀진 지하묘지를 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 3, targetQuantity: 1, rewards: { xp: 6000, gold: 12000, items: [{ itemId: 33, quantity: 1 }] }, requiredLevel: 18 },
    { id: 16, title: '드래곤 슬레이어의 자격', description: '용의 둥지를 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 4, targetQuantity: 1, rewards: { xp: 15000, gold: 35000, items: [{ itemId: 40, quantity: 1 }] }, requiredLevel: 25 },
    { id: 17, title: '심연으로의 첫걸음', description: '불타는 심연을 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 5, targetQuantity: 1, rewards: { xp: 60000, gold: 120000, items: [{ itemId: 12, quantity: 50 }] }, requiredLevel: 30 },
    { id: 18, title: '고대의 파수꾼', description: '고대 골렘의 무덤을 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 6, targetQuantity: 1, rewards: { xp: 70000, gold: 140000, items: [{ itemId: 12, quantity: 70 }] }, requiredLevel: 35 },
    { id: 19, title: '혼돈의 지배자', description: '혼돈의 차원을 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 7, targetQuantity: 1, rewards: { xp: 90000, gold: 170000, items: [{ itemId: 12, quantity: 100 }] }, requiredLevel: 40 },
    { id: 20, title: '지옥의 지배자', description: '지옥의 군주를 1마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 201, targetQuantity: 1, rewards: { xp: 5000, gold: 10000 }, requiredLevel: 32 },
    { id: 21, title: '움직이는 석상', description: '고대 골렘을 1마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 202, targetQuantity: 1, rewards: { xp: 6000, gold: 12000 }, requiredLevel: 37 },
    { id: 22, title: '공허의 눈', description: '심연의 감시자를 1마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 203, targetQuantity: 1, rewards: { xp: 7000, gold: 14000 }, requiredLevel: 42 },
    { id: 23, title: '리치 헌터', description: '리치를 5마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 103, targetQuantity: 5, rewards: { xp: 2000, gold: 4000 }, requiredLevel: 22 },
    { id: 24, title: '가디언 슬레이어', description: '던전 가디언을 10마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 4, targetQuantity: 10, rewards: { xp: 1500, gold: 3000, items: [{ itemId: 12, quantity: 5 }] }, requiredLevel: 14 },
    { id: 25, title: '드래곤 헌터', description: '새끼용을 3마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 104, targetQuantity: 3, rewards: { xp: 10000, gold: 25000, items: [{ itemId: 41, quantity: 1 }] }, requiredLevel: 28 },
    { id: 26, title: '심연의 정복자', description: '지옥의 군주를 5마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 201, targetQuantity: 5, rewards: { xp: 50000, gold: 100000, items: [{ itemId: 71, quantity: 1 }] }, requiredLevel: 45 },
    { id: 27, title: '마력의 대가', description: '마력의 돌을 100개 모으세요.', type: 'COLLECT_ITEM', targetId: 12, targetQuantity: 100, rewards: { xp: 3000, gold: 5000 }, requiredLevel: 20 },
    { id: 28, title: '전설의 갑옷', description: '용비늘 갑옷을 1개 획득하세요.', type: 'COLLECT_ITEM', targetId: 47, targetQuantity: 1, rewards: { xp: 8000, gold: 15000 }, requiredLevel: 26 },
    { id: 29, title: '동굴 탐험가', description: '고블린 동굴을 5번 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 1, targetQuantity: 5, rewards: { xp: 2500, gold: 5000 }, requiredLevel: 9 },
    { id: 30, title: '용의 둥지 전문가', description: '용의 둥지를 3번 클리어하세요.', type: 'CLEAR_DUNGEON', targetId: 4, targetQuantity: 3, rewards: { xp: 20000, gold: 50000, items: [{ itemId: 59, quantity: 1 }] }, requiredLevel: 27 },
    { id: 31, title: '오우거 학살자', description: '오우거를 25마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 102, targetQuantity: 25, rewards: { xp: 7500, gold: 12000 }, requiredLevel: 16 },
    { id: 32, title: '전설의 무기 수집가', description: '엑스칼리버를 획득하세요.', type: 'COLLECT_ITEM', targetId: 38, targetQuantity: 1, rewards: { xp: 15000, gold: 30000 }, requiredLevel: 30 },
    { id: 33, title: '골렘 파괴자', description: '고대 골렘을 3마리 처치하세요.', type: 'DEFEAT_MONSTER', targetId: 202, targetQuantity: 3, rewards: { xp: 45000, gold: 80000 }, requiredLevel: 40 },
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
    { trophies: 1500, rewards: { gold: 15000, items: [{ itemId: 32, quantity: 1 }] } },
    { trophies: 2500, rewards: { gold: 30000, items: [{ itemId: 38, quantity: 1 }] } },
    { trophies: 5000, rewards: { gold: 75000, items: [{ itemId: 41, quantity: 1 }] } },
    { trophies: 10000, rewards: { gold: 200000, items: [{ itemId: 62, quantity: 1 }] } },
];

const getInitialPlayerStats = () => ({
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
    inventory: [{ ...allItems.find(i => i.id === 1), quantity: 1 }],
    equipment: {
        weapon: allItems.find(i => i.id === 1),
        armor: null,
    },
    playerClass: null,
    townLevel: 1,
    townXp: 0,
    activeQuests: [],
    pets: [],
    activePetId: null,
    completedQuestIds: [],
});

// --- UTILITY FUNCTIONS ---
const formatNumber = (num) => num.toLocaleString();

const getDisplayName = (item) => {
    if (!item) return '없음';
    if (item.enhancementLevel && item.enhancementLevel > 0) {
        return `+${item.enhancementLevel} ${item.name}`;
    }
    return item.name;
};

const calculateDamage = (attack, defense) => {
    // Defense provides percentage-based damage reduction
    // Formula: damageReduction = defense / (defense + K) where K is a constant. Let's use 100.
    // e.g., 50 def = 33% reduction, 100 def = 50% reduction, 200 def = 66% reduction
    const damageReduction = defense / (defense + 100);
    const finalDamage = attack * (1 - damageReduction);
    return Math.max(1, Math.round(finalDamage));
};


// --- COMPONENTS ---

const StatBar = ({ value, maxValue, color, label }) => (
    <div className="stat-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.9em' }}>
            <span>{label}</span>
            <span>{formatNumber(Math.ceil(value))} / {formatNumber(maxValue)}</span>
        </div>
        <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

const PlayerStatsView = ({ playerStats, setPlayerStats, setView, resetGame }) => {
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
        const weaponEnhancementBonus = playerStats.equipment.weapon?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.attackBonus || 0) + ((pet.enhancementLevel || 0) * 2);
            }
        }

        return playerStats.attack + weaponDamage + (weaponEnhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armorDefense = playerStats.equipment.armor?.defense || 0;
        const armorEnhancementBonus = playerStats.equipment.armor?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.defenseBonus || 0) + (pet.enhancementLevel || 0);
                const petArmor = pet.equipment?.armor;
                if(petArmor) {
                    petBonus += (petArmor.defense || 0) + (petArmor.enhancementLevel || 0);
                }
            }
        }

        return playerStats.defense + armorDefense + armorEnhancementBonus + petBonus;
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
            <button onClick={resetGame} style={{ marginTop: '20px', backgroundColor: '#c62828' }}>게임 초기화</button>
        </div>
    );
};

const TownView = ({ playerStats, setView, setShowDifficultyModal }) => (
    <div className="card town-layout">
        <h2>마을</h2>
        <p>환장RPG에 오신 것을 환영합니다! 무엇을 하시겠습니까?</p>
        <div className="town-grid">
            <button onClick={() => setView(View.PLAYER)}>내 정보</button>
            <button onClick={() => setView(View.SHOP)}>상점</button>
            <button onClick={() => setView(View.BLACKSMITH)}>대장간</button>
            <button onClick={() => setView(View.QUEST_BOARD)}>퀘스트</button>
            <button onClick={() => {
                if (playerStats.level < 10 && !playerStats.playerClass) {
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
            <button onClick={() => setShowDifficultyModal(true)}>전투 시작</button>
            <button onClick={() => setView(View.DUNGEON)}>던전</button>
        </div>
    </div>
);

const ShopView = ({ playerStats, setPlayerStats, setView }) => {
    const [selectedItem, setSelectedItem] = useState(null);
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
        if (shopTab === 'PetArmor') return item.type === ItemType.PET_ARMOR;
        if (shopTab === 'Consumables') return item.type === ItemType.CONSUMABLE;
        return false;
    });

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>상점</h2>
            <p style={{ textAlign: 'right', fontSize: '1.2em', fontWeight: 'bold' }}>보유 골드: {formatNumber(playerStats.gold)} G</p>
             <div className="shop-tabs">
                <button className={shopTab === 'Weapons' ? 'active' : ''} onClick={() => setShopTab('Weapons')}>무기</button>
                <button className={shopTab === 'Armor' ? 'active' : ''} onClick={() => setShopTab('Armor')}>방어구</button>
                <button className={shopTab === 'PetArmor' ? 'active' : ''} onClick={() => setShopTab('PetArmor')}>펫 방어구</button>
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
                        <p>{formatNumber(item.price)} G</p>
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
                    <p>가격: {formatNumber(selectedItem.price)} G</p>
                    <button onClick={handleBuy} disabled={playerStats.gold < selectedItem.price}>구매</button>
                </div>
            )}
        </div>
    );
};

const InventoryView = ({ playerStats, setPlayerStats, setView }) => {

    const handleEquip = (itemToEquip) => {
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
            const itemInInventoryIndex = newInventory.findIndex(i => i.id === itemToEquip.id && (i.enhancementLevel || 0) === (itemToEquip.enhancementLevel || 0));
            const itemInInventory = newInventory[itemInInventoryIndex];
            if (itemInInventory.quantity > 1) {
                newInventory[itemInInventoryIndex] = {...itemInInventory, quantity: itemInInventory.quantity - 1};
            } else {
                newInventory.splice(itemInInventoryIndex, 1);
            }

            // Add previously equipped item back to inventory
            if (previouslyEquipped) {
                 const existingItemIndex = newInventory.findIndex(i => i.id === previouslyEquipped.id && (i.enhancementLevel || 0) === (previouslyEquipped.enhancementLevel || 0));
                if (existingItemIndex > -1) {
                    newInventory[existingItemIndex] = {...newInventory[existingItemIndex], quantity: newInventory[existingItemIndex].quantity + 1};
                } else {
                    newInventory.push({ ...previouslyEquipped, quantity: 1 });
                }
            }

            return { ...prev, equipment: newEquipment, inventory: newInventory };
        });
    };
    
     const handleUse = (itemToUse) => {
        if (itemToUse.type === ItemType.CONSUMABLE && itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                
                return { ...prev, hp: newHp, inventory: newInventory };
            });
        } else if (itemToUse.type === ItemType.CONSUMABLE && itemToUse.effect?.type === 'job_change') {
            if (!playerStats.playerClass) {
                alert("현재 직업이 없어 사용할 수 없습니다.");
                return;
            }
            if (confirm("정말로 직업을 변경하시겠습니까? 현재 직업의 능력치가 초기화됩니다.")) {
                setPlayerStats(prev => {
                    const oldClassBonuses = PlayerClasses[prev.playerClass].bonuses;
                    const newAttack = prev.attack - (oldClassBonuses.attack || 0);
                    const newDefense = prev.defense - (oldClassBonuses.defense || 0);
                    const newMaxHp = prev.maxHp - (oldClassBonuses.maxHp || 0);

                    const newInventory = prev.inventory.map(item =>
                        item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                    ).filter(item => item.quantity > 0);

                    return {
                        ...prev,
                        playerClass: null,
                        attack: newAttack,
                        defense: newDefense,
                        maxHp: newMaxHp,
                        hp: Math.min(newMaxHp, prev.hp),
                        inventory: newInventory,
                    };
                });
                alert("직업이 초기화되었습니다. 새로운 직업을 선택해주세요.");
                setView(View.CLASS_SELECTION);
            }
        }
    };
    
    const handleSell = (itemToSell) => {
        const isEquipped = (playerStats.equipment.weapon && playerStats.equipment.weapon.id === itemToSell.id && (playerStats.equipment.weapon.enhancementLevel || 0) === (itemToSell.enhancementLevel || 0)) ||
                           (playerStats.equipment.armor && playerStats.equipment.armor.id === itemToSell.id && (playerStats.equipment.armor.enhancementLevel || 0) === (itemToSell.enhancementLevel || 0));

        if (isEquipped) {
            alert("장착 중인 아이템은 판매할 수 없습니다.");
            return;
        }

        const sellPrice = Math.floor(itemToSell.price * 0.4); // Sell for 40% of original price
        if (confirm(`${getDisplayName(itemToSell)}을(를) ${sellPrice} G에 판매하시겠습니까?`)) {
            setPlayerStats(prev => {
                const newInventory = [...prev.inventory];
                const itemIndex = newInventory.findIndex(i => i.id === itemToSell.id && (i.enhancementLevel || 0) === (itemToSell.enhancementLevel || 0));

                if (itemIndex === -1) return prev; // Should not happen

                if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex].quantity -= 1;
                } else {
                    newInventory.splice(itemIndex, 1);
                }

                return {
                    ...prev,
                    gold: prev.gold + sellPrice,
                    inventory: newInventory
                };
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
                            <button onClick={() => handleSell(item)} style={{marginLeft: '5px'}}>판매</button>
                        </div>
                    </div>
                )) : <p>인벤토리가 비어있습니다.</p>}
            </div>
        </div>
    );
};

const BattleView = ({ playerStats, setPlayerStats, setView, difficulty }) => {
    const [monster, setMonster] = useState(null);
    const [battleLog, setBattleLog] = useState([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [isBattleOver, setIsBattleOver] = useState(false);
    const [damagePopups, setDamagePopups] = useState([]);
    const [playerAttacking, setPlayerAttacking] = useState(false);
    const [enemyAttacking, setEnemyAttacking] = useState(false);
    const [ultimateCharge, setUltimateCharge] = useState(0);
    const [showInventory, setShowInventory] = useState(false);
    
    const addDamagePopup = useCallback((amount, isCrit, target) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, amount, isCrit, target }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 600);
    }, []);

    const addLog = useCallback((message, type, petSkill = false) => {
      const className = petSkill ? 'pet-skill-message' : type;
      setBattleLog(prev => [...prev, <p key={prev.length} className={className}>{message}</p>]);
    }, []);

    const totalAttack = useMemo(() => {
        const weapon = playerStats.equipment.weapon;
        const weaponDamage = weapon?.damage || 0;
        const weaponEnhancementBonus = weapon?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.attackBonus || 0) + ((pet.enhancementLevel || 0) * 2);
            }
        }

        return playerStats.attack + weaponDamage + (weaponEnhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armor = playerStats.equipment.armor;
        const armorDefense = armor?.defense || 0;
        const armorEnhancementBonus = armor?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.defenseBonus || 0) + (pet.enhancementLevel || 0);
                const petArmor = pet.equipment?.armor;
                if(petArmor) {
                    petBonus += (petArmor.defense || 0) + (petArmor.enhancementLevel || 0);
                }
            }
        }
        return playerStats.defense + armorDefense + armorEnhancementBonus + petBonus;
    }, [playerStats]);
    
    const activePet = useMemo(() => playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId) : null, [playerStats.activePetId, playerStats.pets]);

    const playerConsumables = useMemo(() => 
        playerStats.inventory.filter(i => i.type === ItemType.CONSUMABLE), 
        [playerStats.inventory]
    );

    useEffect(() => {
        const getBattleMonster = () => {
            const level = playerStats.level;
            let possibleMonsters;

            if (level < 5) {
                possibleMonsters = allMonsters.filter(m => [1, 2].includes(m.id));
            } else if (level < 10) {
                possibleMonsters = allMonsters.filter(m => [2, 3].includes(m.id));
            } else if (level < 15) {
                possibleMonsters = allMonsters.filter(m => [3, 101, 4].includes(m.id));
            } else if (level < 25) {
                possibleMonsters = allMonsters.filter(m => [101, 102, 4].includes(m.id));
            } else {
                possibleMonsters = allMonsters.filter(m => [102, 103, 104].includes(m.id));
            }

            const baseMonster = { ...possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)] };
            
            const scalingFactor = 1 + (level - 1) * 0.15; // 15% stronger per level
            const difficultyMultipliers = { Easy: 0.75, Medium: 1.0, Hard: 1.5 };
            const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;
            const finalMultiplier = scalingFactor * difficultyMultiplier;

            const scaledMonster = {
                ...baseMonster,
                maxHp: Math.round(baseMonster.maxHp * finalMultiplier),
                hp: Math.round(baseMonster.maxHp * finalMultiplier),
                attack: Math.round(baseMonster.attack * finalMultiplier),
                defense: Math.round(baseMonster.defense * finalMultiplier),
                xp: Math.round(baseMonster.xp * finalMultiplier),
                gold: Math.round(baseMonster.gold * finalMultiplier),
            };

            return scaledMonster;
        };
        
        if (!monster) {
            const randomMonster = getBattleMonster();
            const difficultyText = { Easy: '쉬움', Medium: '중간', Hard: '어려움' };
            setMonster(randomMonster);
            addLog(`${randomMonster.name} (Lv.${playerStats.level}) 이(가) 나타났다! [${difficultyText[difficulty]}]`, 'system-message');
        }
    }, [addLog, monster, playerStats.level, difficulty]);

    const handleBattleEnd = useCallback((win) => {
        setIsBattleOver(true);
        if (win && monster) {
            const goldEarned = monster.gold;
            const xpEarned = monster.xp;
            const trophiesGained = monster.id > 100 ? (monster.id - 100) * 2 : monster.id * 3;
            addLog(`승리! ${goldEarned} G와 ${xpEarned} XP, 트로피 ${trophiesGained}개를 획득했다!`, 'system-message');
            addLog(`전투의 피로가 가시고 HP가 모두 회복되었다!`, 'effect-message');
            
            const townXpGained = Math.floor(monster.xp / 2);
            if (townXpGained > 0) {
                 addLog(`마을 경험치 ${townXpGained} XP를 획득했다!`, 'effect-message');
            }

            const itemDrops = [];
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
                    newDefense += 2;
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
                    let newProgress = quest.currentProgress || 0;
                    if (quest.type === 'DEFEAT_MONSTER' && quest.targetId === monster.id) {
                        newProgress += 1;
                    }
                    return { ...quest, currentProgress: newProgress };
                });

                return {
                    ...prev,
                    hp: newMaxHp,
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
            addLog('패배했다... 하지만 HP가 모두 회복되었다!', 'system-message');
            setPlayerStats(prev => ({...prev, hp: prev.maxHp }));
        }
    }, [addLog, monster, setPlayerStats]);
    
    const handleEnemyTurn = useCallback(() => {
        if (!monster || playerStats.hp <= 0) return;

        if (monster.statusEffects?.stun && monster.statusEffects.stun > 0) {
            addLog(`${monster.name}이(가) 기절해서 움직일 수 없다!`, 'system-message');
            setMonster(prev => ({...prev, statusEffects: { stun: prev.statusEffects.stun - 1 }}));
            setIsPlayerTurn(true);
            return;
        }

        setEnemyAttacking(true);
        setTimeout(() => setEnemyAttacking(false), 400);

        let damage = calculateDamage(monster.attack, totalDefense);
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
            let attackPower = totalAttack;
            attackPower = isCrit ? Math.floor(attackPower * critMultiplier) : attackPower;
            let damage = calculateDamage(attackPower, monster.defense);
            
            addLog(`${playerStats.playerName}의 공격! ${monster.name}에게 ${damage}의 피해를 입혔다.${isCrit ? ' (치명타!)' : ''}`, 'player-turn');
            addDamagePopup(String(damage), isCrit, 'enemy');
            
            let totalDamage = damage;

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

            const newMonsterHp = monster.hp - totalDamage;
            setMonster({ ...monster, hp: newMonsterHp });

            if (newMonsterHp <= 0) {
                handleBattleEnd(true);
                return;
            }
        }
        
        setUltimateCharge(prev => Math.min(5, prev + 1));
        setIsPlayerTurn(false);
    };

    const handleUsePotion = (itemToUse) => {
        if (!isPlayerTurn || isBattleOver || !monster) return;

        if (itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                
                addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 사용해 HP를 ${itemToUse.effect.amount} 회복했다.`, 'player-turn');

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
        let isCritUltimate = true;

        if (playerClass === 'Warrior') {
            damage = calculateDamage(Math.floor(totalAttack * 3), monster.defense);
            const stunApplied = Math.random() < 0.5;
            if (stunApplied) {
                setMonster(prev => ({...prev, statusEffects: { stun: 1 }}));
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입히고 기절시켰다!`;
            } else {
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입혔다!`;
            }
        } else if (playerClass === 'Archer') {
            const weapon = playerStats.equipment.weapon;
            const critMultiplier = (weapon?.critDamageMultiplier || 1.5) * 2;
            damage = calculateDamage(Math.floor(totalAttack * critMultiplier), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Archer.name}'! ${monster.name}에게 ${damage}의 치명적인 피해를 입혔다!`;
        } else if (playerClass === 'Magician') {
            damage = calculateDamage(Math.floor(totalAttack * 4), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Magician.name}'! ${monster.name}에게 ${damage}의 막대한 피해를 입혔다!`;
        } else { // Adventurer
            damage = calculateDamage(Math.floor(totalAttack * 2.5), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Adventurer.name}'! ${monster.name}에게 ${damage}의 강력한 피해를 입혔다!`;
        }

        addLog(logMessage, 'player-turn');
        addDamagePopup(String(damage), isCritUltimate, 'enemy');

        const newMonsterHp = monster.hp - damage;
        setMonster(m => ({ ...m, hp: newMonsterHp }));
        
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
                    <div className="modal-content card">
                        <h3>아이템 사용</h3>
                        <div className="inventory-list">
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
                        {activePet.type === 'Griffin' ? '🦅' : activePet.type === 'Turtle' ? '🐢' : activePet.type === 'Phoenix' ? '🔥' : '🐲' }
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

const ClassSelectionView = ({ playerStats, setPlayerStats, setView }) => {
    const handleSelectClass = (className) => {
        if (playerStats.playerClass) {
            alert("이미 직업을 선택했습니다. 변경하려면 '직업 변경 메달리온'을 사용하세요.");
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
                <p>당신은 이미 자신의 길을 걷고 있습니다. 다른 길을 원한다면 '직업 변경 메달리온'을 사용하세요.</p>
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
                        <button onClick={() => handleSelectClass(key)}>선택</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DungeonBattleView = ({ dungeon, playerStats, setPlayerStats, endDungeon }) => {
    const [currentStage, setCurrentStage] = useState(1);
    const [monster, setMonster] = useState(null);
    const [battleLog, setBattleLog] = useState([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [damagePopups, setDamagePopups] = useState([]);
    const [playerAttacking, setPlayerAttacking] = useState(false);
    const [enemyAttacking, setEnemyAttacking] = useState(false);
    const [ultimateCharge, setUltimateCharge] = useState(0);
    const [showInventory, setShowInventory] = useState(false);
    
    const addDamagePopup = useCallback((amount, isCrit, target) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, amount, isCrit, target }]);
        setTimeout(() => setDamagePopups(prev => prev.filter(p => p.id !== id)), 600);
    }, []);

    const addLog = useCallback((message, type, petSkill = false) => {
        const className = petSkill ? 'pet-skill-message' : type;
        setBattleLog(prev => [...prev, <p key={prev.length} className={className}>{message}</p>]);
    }, []);

    const totalAttack = useMemo(() => {
        const weapon = playerStats.equipment.weapon;
        const weaponDamage = weapon?.damage || 0;
        const weaponEnhancementBonus = weapon?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.attackBonus || 0) + ((pet.enhancementLevel || 0) * 2);
            }
        }

        return playerStats.attack + weaponDamage + (weaponEnhancementBonus * 2) + petBonus;
    }, [playerStats]);

    const totalDefense = useMemo(() => {
        const armor = playerStats.equipment.armor;
        const armorDefense = armor?.defense || 0;
        const armorEnhancementBonus = armor?.enhancementLevel || 0;
        
        let petBonus = 0;
        if (playerStats.activePetId) {
            const pet = playerStats.pets.find(p => p.id === playerStats.activePetId);
            if (pet) {
                petBonus = (pet.defenseBonus || 0) + (pet.enhancementLevel || 0);
                const petArmor = pet.equipment?.armor;
                if(petArmor) {
                    petBonus += (petArmor.defense || 0) + (petArmor.enhancementLevel || 0);
                }
            }
        }

        return playerStats.defense + armorDefense + armorEnhancementBonus + petBonus;
    }, [playerStats]);
    
    const activePet = useMemo(() => playerStats.activePetId ? playerStats.pets.find(p => p.id === playerStats.activePetId) : null, [playerStats.activePetId, playerStats.pets]);

    const playerConsumables = useMemo(() => 
        playerStats.inventory.filter(i => i.type === ItemType.CONSUMABLE), 
        [playerStats.inventory]
    );

    useEffect(() => {
        const monsterId = dungeon.monsters[currentStage - 1];
        const newMonster = { ...allMonsters.find(m => m.id === monsterId) };
        setMonster(newMonster);
        setIsPlayerTurn(true);
        setBattleLog([]);
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

        const itemDrops = [];
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
                newDefense += 2;
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
                let newProgress = quest.currentProgress || 0;
                if (quest.type === 'DEFEAT_MONSTER' && quest.targetId === monster.id) {
                    newProgress += 1;
                }
                return { ...quest, currentProgress: newProgress };
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
                    const itemInfo = allItems.find(i => i.id === rewardItem.itemId);
                    const existingItem = newInventory.find(i => i.id === itemInfo.id && !(i.enhancementLevel > 0));
                    if (existingItem) {
                        existingItem.quantity += rewardItem.quantity;
                    } else {
                        newInventory.push({ ...itemInfo, quantity: rewardItem.quantity });
                    }
                });
                
                const updatedQuests = prev.activeQuests.map(quest => {
                   if (!quest.isCompleted && quest.type === 'CLEAR_DUNGEON' && quest.targetId === dungeon.id) {
                       return { ...quest, currentProgress: (quest.currentProgress || 0) + 1 };
                   }
                   return quest;
                });

                return { ...prev, xp: finalXp, gold: finalGold, inventory: newInventory, activeQuests: updatedQuests, hp: prev.maxHp };
            });
            setTimeout(() => endDungeon(true), 2000);
        }
    }, [monster, currentStage, dungeon, setPlayerStats, addLog, endDungeon]);

    const handleBattleFailed = useCallback(() => {
        addLog('던전 공략 실패... HP가 모두 회복되었다!', 'system-message');
        setPlayerStats(prev => ({ ...prev, hp: prev.maxHp }));
        setTimeout(() => endDungeon(false), 2000);
    }, [addLog, setPlayerStats, endDungeon]);

    const handleEnemyTurn = useCallback(() => {
        if (!monster || playerStats.hp <= 0) return;
        setEnemyAttacking(true);
        setTimeout(() => setEnemyAttacking(false), 400);

        const damage = calculateDamage(monster.attack, totalDefense);
        addLog(`${monster.name}의 공격! ${playerStats.playerName}에게 ${damage}의 피해를 입혔다.`, 'enemy-turn');
        addDamagePopup(String(damage), false, 'player');
        
        const newPlayerHp = playerStats.hp - damage;
        setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));

        if (newPlayerHp <= 0) {
            handleBattleFailed();
        } else {
            setIsPlayerTurn(true);
        }
    }, [monster, playerStats.hp, playerStats.playerName, totalDefense, addLog, addDamagePopup, handleBattleFailed, setPlayerStats]);

    const handlePlayerAttack = () => {
        if (!isPlayerTurn || !monster) return;
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
            let attackPower = totalAttack;
            attackPower = isCrit ? Math.floor(attackPower * critMultiplier) : attackPower;
            let damage = calculateDamage(attackPower, monster.defense);
            
            addLog(`${playerStats.playerName}의 공격! ${monster.name}에게 ${damage}의 피해를 입혔다.${isCrit ? ' (치명타!)' : ''}`, 'player-turn');
            addDamagePopup(String(damage), isCrit, 'enemy');
            
            let totalDamage = damage;
            
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
            
            const newMonsterHp = monster.hp - totalDamage;
            if (newMonsterHp <= 0) {
                setMonster({ ...monster, hp: 0 });
                handleMonsterDefeated();
                return;
            }
            setMonster({ ...monster, hp: newMonsterHp });
        }
        setUltimateCharge(prev => Math.min(5, prev + 1));
        setIsPlayerTurn(false);
    };
    
    const handleUsePotion = (itemToUse) => {
        if (!isPlayerTurn || !monster) return;
        
        setShowInventory(false);

        if (itemToUse.effect?.type === 'heal') {
            setPlayerStats(prev => {
                const newHp = Math.min(prev.maxHp, prev.hp + itemToUse.effect.amount);
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 사용해 HP를 ${itemToUse.effect.amount} 회복했다.`, 'player-turn');
                return { ...prev, hp: newHp, inventory: newInventory };
            });
        } else if (itemToUse.effect?.type === 'damage_enemy') {
            const damage = itemToUse.effect.amount;
            addLog(`${playerStats.playerName}이(가) ${itemToUse.name}을(를) 던져 ${monster.name}에게 ${damage}의 피해를 입혔다!`, 'player-turn');
            addDamagePopup(String(damage), false, 'enemy');

            const newMonsterHp = monster.hp - damage;
            setPlayerStats(prev => {
                const newInventory = prev.inventory.map(item =>
                    item.id === itemToUse.id ? { ...item, quantity: item.quantity - 1 } : item
                ).filter(item => item.quantity > 0);
                return { ...prev, inventory: newInventory };
            });
            
            if (newMonsterHp <= 0) {
                setMonster({ ...monster, hp: 0 });
                handleMonsterDefeated();
                return;
            }
            setMonster({ ...monster, hp: newMonsterHp });
        }
        setUltimateCharge(prev => Math.min(5, prev + 1));
        setIsPlayerTurn(false);
    };

    const handleUseUltimate = () => {
        if (ultimateCharge < 5 || !isPlayerTurn || !monster) return;
        
        const playerClass = playerStats.playerClass || 'Adventurer';
        let damage = 0;
        let logMessage = '';
        let isCritUltimate = true;

        if (playerClass === 'Warrior') {
            damage = calculateDamage(Math.floor(totalAttack * 3), monster.defense);
            const stunApplied = Math.random() < 0.5;
            if (stunApplied) {
                setMonster(prev => ({...prev, statusEffects: { stun: 1 }}));
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입히고 기절시켰다!`;
            } else {
                logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Warrior.name}'! ${monster.name}에게 ${damage}의 피해를 입혔다!`;
            }
        } else if (playerClass === 'Archer') {
            const weapon = playerStats.equipment.weapon;
            const critMultiplier = (weapon?.critDamageMultiplier || 1.5) * 2;
            damage = calculateDamage(Math.floor(totalAttack * critMultiplier), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Archer.name}'! ${monster.name}에게 ${damage}의 치명적인 피해를 입혔다!`;
        } else if (playerClass === 'Magician') {
            damage = calculateDamage(Math.floor(totalAttack * 4), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Magician.name}'! ${monster.name}에게 ${damage}의 막대한 피해를 입혔다!`;
        } else { // Adventurer
            damage = calculateDamage(Math.floor(totalAttack * 2.5), monster.defense);
            logMessage = `${playerStats.playerName}의 궁극기 '${UltimateSkills.Adventurer.name}'! ${monster.name}에게 ${damage}의 강력한 피해를 입혔다!`;
        }

        addLog(logMessage, 'player-turn');
        addDamagePopup(String(damage), isCritUltimate, 'enemy');
        setUltimateCharge(0);

        const newMonsterHp = monster.hp - damage;
        if (newMonsterHp <= 0) {
            setMonster({ ...monster, hp: 0 });
            handleMonsterDefeated();
        } else {
            setMonster(m => ({ ...m, hp: newMonsterHp }));
            setIsPlayerTurn(false);
        }
    };
    
    useEffect(() => {
        if (!isPlayerTurn && monster?.hp > 0 && playerStats.hp > 0) {
            const timer = setTimeout(() => handleEnemyTurn(), 1000);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, monster, playerStats, handleEnemyTurn]);

    if (!monster) return <div className="card">로딩 중...</div>;

    return (
        <div className="card">
            <h2>{dungeon.name} - 스테이지 {currentStage}/{dungeon.stages}</h2>
            {showInventory && (
                <div className="modal-backdrop">
                    <div className="modal-content card">
                        <h3>아이템 사용</h3>
                        <div className="inventory-list">
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
                    {activePet && <span className="pet-character">{activePet.type === 'Griffin' ? '🦅' : activePet.type === 'Turtle' ? '🐢' : '🐲'}</span>}
                    {damagePopups.filter(p => p.target === 'player').map(p => (<div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>))}
                </div>
                <div className={`character-container enemy-side ${enemyAttacking ? 'attacking' : ''}`}>
                    <StatBar value={monster.hp} maxValue={monster.maxHp} color="#f44336" label={monster.name} />
                    <span className="character">{monster.emoji}</span>
                     {damagePopups.filter(p => p.target === 'enemy').map(p => (<div key={p.id} className={`damage-popup ${p.isCrit ? 'crit' : ''}`}>{p.amount}</div>))}
                </div>
            </div>
            <div className="battle-log" ref={el => el?.scrollTo(0, el.scrollHeight)}>{battleLog}</div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {monster.hp <= 0 ? (
                    <p>다음 스테이지로 이동 중...</p>
                ) : playerStats.hp <= 0 ? (
                    <p>마을로 돌아가는 중...</p>
                ) : (
                     <div className="battle-actions">
                        <button onClick={handlePlayerAttack} disabled={!isPlayerTurn}>공격</button>
                        <button onClick={() => setShowInventory(true)} disabled={!isPlayerTurn}>아이템</button>
                        <button onClick={handleUseUltimate} disabled={!isPlayerTurn || ultimateCharge < 5} className="ultimate-button">궁극기 ({ultimateCharge}/5)</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DungeonView = ({ setView, setCurrentDungeon }) => {
    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>던전</h2>
            <p>도전할 던전을 선택하세요.</p>
            <div className="dungeon-list">
                {allDungeons.map(dungeon => (
                    <div key={dungeon.id} className="dungeon-card">
                        <h3>{dungeon.name} (난이도: {dungeon.difficulty})</h3>
                        <p>{dungeon.description}</p>
                        <div className="dungeon-card-rewards">
                            <h4>주요 보상:</h4>
                            <ul>
                                <li>{formatNumber(dungeon.rewards.xp)} XP</li>
                                <li>{formatNumber(dungeon.rewards.gold)} G</li>
                                {dungeon.rewards.items.map(item => (
                                    <li key={item.itemId}>{allItems.find(i=>i.id === item.itemId)?.name} x{item.quantity}</li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={() => setCurrentDungeon(dungeon)}>도전</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BlacksmithView = ({ playerStats, setPlayerStats, setView }) => {
    const [tab, setTab] = useState('item'); // 'item' or 'pet'
    const [selectedEntity, setSelectedEntity] = useState(null);

    const enhancableItems = useMemo(() => {
        return playerStats.inventory
            .filter(item => item.type === ItemType.WEAPON || item.type === ItemType.ARMOR || item.type === ItemType.PET_ARMOR)
            .sort((a,b) => (ItemGradeInfo[b.grade]?.order || 0) - (ItemGradeInfo[a.grade]?.order || 0) || (a.enhancementLevel || 0) - (b.enhancementLevel || 0));
    }, [playerStats.inventory]);
    
    const enhancablePets = useMemo(() => {
        return [...playerStats.pets].sort((a, b) => (ItemGradeInfo[b.grade]?.order || 0) - (ItemGradeInfo[a.grade]?.order || 0));
    }, [playerStats.pets]);

    const getItemEnhancementCost = (item) => {
        if (!item) return { gold: 0, materials: [] };
        const level = item.enhancementLevel || 0;
        const gradeMultiplier = { COMMON: 1, UNCOMMON: 1.5, RARE: 2, EPIC: 3, LEGENDARY: 5, MYTHIC: 10, SECRET: 20, ULTIMATE: 40 };
        
        const goldCost = Math.floor(item.price * 0.1 * Math.pow(1.5, level) * (gradeMultiplier[item.grade] || 1));
        
        let materialQuantity = 0;
        if(level < 3) materialQuantity = 1 + level;
        else if (level < 6) materialQuantity = 5 + (level - 3) * 2;
        else if (level < 9) materialQuantity = 15 + (level - 6) * 5;
        else materialQuantity = 40 + (level - 9) * 10;

        materialQuantity = Math.floor(materialQuantity * ((gradeMultiplier[item.grade] || 1) / 2 + 0.5));

        return {
            gold: goldCost,
            materials: [{ materialId: 12, quantity: materialQuantity }]
        };
    };
    
    const getPetEnhancementCost = (pet) => {
        if (!pet) return { gold: 0, materials: [] };
        const level = pet.enhancementLevel || 0;
        const gradeMultiplier = { [ItemGrade.RARE]: 2, [ItemGrade.EPIC]: 4, [ItemGrade.LEGENDARY]: 8, [ItemGrade.MYTHIC]: 16, [ItemGrade.SECRET]: 32 };

        const goldCost = Math.floor(200 * Math.pow(1.8, level) * (gradeMultiplier[pet.grade] || 1));
        const materialQuantity = Math.ceil(3 * Math.pow(1.6, level) * (gradeMultiplier[pet.grade] || 1));

        return {
            gold: goldCost,
            materials: [{ materialId: 12, quantity: materialQuantity }]
        };
    };
    
    const enhancementCost = tab === 'item' ? getItemEnhancementCost(selectedEntity) : getPetEnhancementCost(selectedEntity);

    const canEnhance = () => {
        if (!selectedEntity) return false;
        if (playerStats.gold < enhancementCost.gold) return false;
        
        for (const mat of enhancementCost.materials) {
            const playerMat = playerStats.inventory.find(i => i.id === mat.materialId);
            if (!playerMat || playerMat.quantity < mat.quantity) return false;
        }
        return true;
    };

    const handleItemEnhance = () => {
        if (!canEnhance()) {
            alert('재료 또는 골드가 부족합니다.');
            return;
        }

        setPlayerStats(prev => {
            let newInventory = [...prev.inventory];

            // Deduct cost
            let newGold = prev.gold - enhancementCost.gold;
            enhancementCost.materials.forEach(mat => {
                const matIndex = newInventory.findIndex(i => i.id === mat.materialId);
                newInventory[matIndex].quantity -= mat.quantity;
            });
            newInventory = newInventory.filter(i => i.quantity > 0);

            // Remove one of the old items
            const itemIndex = newInventory.findIndex(i => i.id === selectedEntity.id && (i.enhancementLevel || 0) === (selectedEntity.enhancementLevel || 0));
            if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex].quantity--;
            } else {
                newInventory.splice(itemIndex, 1);
            }

            // Add the new enhanced item
            const newEnhancedItem = { ...selectedEntity, enhancementLevel: (selectedEntity.enhancementLevel || 0) + 1, quantity: 1 };
            
            const existingStack = newInventory.find(i => i.id === newEnhancedItem.id && i.enhancementLevel === newEnhancedItem.enhancementLevel);
            if (existingStack) {
                existingStack.quantity++;
            } else {
                newInventory.push(newEnhancedItem);
            }
            
            setSelectedEntity(newEnhancedItem);
            return { ...prev, gold: newGold, inventory: newInventory };
        });
        alert('강화에 성공했습니다!');
    };
    
    const handlePetEnhance = () => {
        if (!canEnhance()) {
            alert('재료 또는 골드가 부족합니다.');
            return;
        }

        setPlayerStats(prev => {
            let newInventory = [...prev.inventory];
            let newGold = prev.gold - enhancementCost.gold;
            enhancementCost.materials.forEach(mat => {
                const matIndex = newInventory.findIndex(i => i.id === mat.materialId);
                if (matIndex !== -1) newInventory[matIndex].quantity -= mat.quantity;
            });
            newInventory = newInventory.filter(i => i.quantity > 0);
            
            const newPets = prev.pets.map(p => 
                p.id === selectedEntity.id 
                ? { ...p, enhancementLevel: (p.enhancementLevel || 0) + 1 }
                : p
            );
            
            const newlyEnhancedPet = newPets.find(p => p.id === selectedEntity.id);
            setSelectedEntity(newlyEnhancedPet);

            return { ...prev, gold: newGold, inventory: newInventory, pets: newPets };
        });
        alert('펫 강화에 성공했습니다!');
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>대장간</h2>
            <div className="shop-tabs">
                <button className={tab === 'item' ? 'active' : ''} onClick={() => { setTab('item'); setSelectedEntity(null); }}>장비 강화</button>
                <button className={tab === 'pet' ? 'active' : ''} onClick={() => { setTab('pet'); setSelectedEntity(null); }}>펫 강화</button>
            </div>
            <p>장착 중인 장비는 강화할 수 없습니다. 해제 후 시도해주세요.</p>
            <div className="blacksmith-container">
                <div className="item-list-panel card">
                    <h3>강화할 대상 선택</h3>
                    {tab === 'item' ? (
                        enhancableItems.map(item => (
                            <div 
                                key={`${item.id}-${item.enhancementLevel||0}`} 
                                className={`list-item ${selectedEntity?.id === item.id && (selectedEntity.enhancementLevel||0) === (item.enhancementLevel||0) ? 'selected' : ''}`}
                                onClick={() => setSelectedEntity(item)}
                            >
                                <span className={ItemGradeInfo[item.grade]?.class}>{getDisplayName(item)} (x{item.quantity})</span>
                            </div>
                        ))
                    ) : (
                        enhancablePets.map(pet => (
                             <div 
                                key={pet.id} 
                                className={`list-item ${selectedEntity?.id === pet.id ? 'selected' : ''}`}
                                onClick={() => setSelectedEntity(pet)}
                            >
                                <span className={ItemGradeInfo[pet.grade]?.class}>{getDisplayName(pet)}</span>
                            </div>
                        ))
                    )}
                </div>
                <div className="enhancement-panel card">
                    {!selectedEntity ? <p>강화할 대상을 선택해주세요.</p> : (
                        <>
                            <h3>{getDisplayName(selectedEntity)} 강화</h3>
                             <div className="enhancement-stats">
                                {tab === 'item' ? (<>
                                    {selectedEntity.type === ItemType.WEAPON && <p>공격력: {selectedEntity.damage + ((selectedEntity.enhancementLevel || 0) * 2)} <span className="arrow">→</span> {selectedEntity.damage + ((selectedEntity.enhancementLevel || 0) + 1) * 2}</p>}
                                    {(selectedEntity.type === ItemType.ARMOR || selectedEntity.type === ItemType.PET_ARMOR) && <p>방어력: {selectedEntity.defense + (selectedEntity.enhancementLevel || 0)} <span className="arrow">→</span> {selectedEntity.defense + (selectedEntity.enhancementLevel || 0) + 1}</p>}
                                </>) : (<>
                                    <p>공격력 보너스: {selectedEntity.attackBonus + ((selectedEntity.enhancementLevel || 0) * 2)} <span className="arrow">→</span> {selectedEntity.attackBonus + ((selectedEntity.enhancementLevel || 0) + 1) * 2}</p>
                                    <p>방어력 보너스: {selectedEntity.defenseBonus + (selectedEntity.enhancementLevel || 0)} <span className="arrow">→</span> {selectedEntity.defenseBonus + (selectedEntity.enhancementLevel || 0) + 1}</p>
                                </>)}
                            </div>
                            <h4>필요 재료</h4>
                            <ul className="material-list">
                                <li className={playerStats.gold >= enhancementCost.gold ? 'sufficient' : 'insufficient'}>
                                    골드: {formatNumber(enhancementCost.gold)} G (보유: {formatNumber(playerStats.gold)})
                                </li>
                                {enhancementCost.materials.map(mat => {
                                    const playerMat = playerStats.inventory.find(i => i.id === mat.materialId);
                                    const playerQty = playerMat?.quantity || 0;
                                    const matInfo = allItems.find(i => i.id === mat.materialId);
                                    return (
                                        <li key={mat.materialId} className={playerQty >= mat.quantity ? 'sufficient' : 'insufficient'}>
                                            {matInfo.name}: {mat.quantity} (보유: {playerQty})
                                        </li>
                                    )
                                })}
                            </ul>
                            <button onClick={tab === 'item' ? handleItemEnhance : handlePetEnhance} disabled={!canEnhance()}>강화하기</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuestBoardView = ({ playerStats, setPlayerStats, setView }) => {
    const [availableQuests, setAvailableQuests] = useState([]);

    useEffect(() => {
        const acceptedQuestIds = playerStats.activeQuests.map(q => q.id);
        const completedIds = playerStats.completedQuestIds || [];
        const allTakenIds = new Set([...acceptedQuestIds, ...completedIds]);

        // Show quests that are available now or will be available soon (within 2 levels)
        const potentialQuests = allQuests.filter(q => 
            !allTakenIds.has(q.id) && 
            (playerStats.level + 2) >= (q.requiredLevel || 1)
        ).sort((a, b) => (a.requiredLevel || 1) - (b.requiredLevel || 1));

        setAvailableQuests(potentialQuests.slice(0, 10));
    }, [playerStats]);

    const acceptQuest = (quest) => {
        const newQuest = { ...quest, currentProgress: 0, isCompleted: false };
        setPlayerStats(prev => ({
            ...prev,
            activeQuests: [...prev.activeQuests, newQuest]
        }));
    };

    const completeQuest = (quest) => {
         setPlayerStats(prev => {
            const newQuests = prev.activeQuests.filter(q => q.id !== quest.id);
            let newGold = prev.gold + quest.rewards.gold;
            let newXp = prev.xp + quest.rewards.xp;
            let newInventory = [...prev.inventory];
            quest.rewards.items?.forEach(rewardItem => {
                const itemInfo = allItems.find(i => i.id === rewardItem.itemId);
                const existingItem = newInventory.find(i => i.id === itemInfo.id && !(i.enhancementLevel > 0));
                if(existingItem) existingItem.quantity += rewardItem.quantity;
                else newInventory.push({...itemInfo, quantity: rewardItem.quantity});
            });

            // Level up check
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
                newDefense += 2;
                newXpToNextLevel = Math.floor(newXpToNextLevel * 1.2);
                alert(`레벨 업! ${newLevel}레벨이 되었다!`);
            }

            return {
                ...prev,
                activeQuests: newQuests,
                completedQuestIds: [...(prev.completedQuestIds || []), quest.id],
                gold: newGold,
                xp: newXp,
                inventory: newInventory,
                level: newLevel,
                maxHp: newMaxHp,
                attack: newAttack,
                defense: newDefense,
                xpToNextLevel: newXpToNextLevel,
            }
         });
         alert(`${quest.title} 퀘스트 완료!`);
    };
    
    const getQuestProgress = (quest) => {
        if (quest.type === 'COLLECT_ITEM' || quest.type === 'CRAFT_ITEM') {
            const itemInInventory = playerStats.inventory.find(i => i.id === quest.targetId);
            return itemInInventory ? itemInInventory.quantity : 0;
        }
        return quest.currentProgress || 0;
    };

    const checkCompletion = (quest) => {
        return getQuestProgress(quest) >= quest.targetQuantity;
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>퀘스트 게시판</h2>
            <div className="quest-section">
                <h3>진행 중인 퀘스트</h3>
                {playerStats.activeQuests.length > 0 ? playerStats.activeQuests.map(quest => {
                    const progress = getQuestProgress(quest);
                    const isComplete = checkCompletion(quest);
                    return (
                        <div key={quest.id} className={`card quest-card ${isComplete ? 'completed' : ''}`}>
                            <div>
                                <h4>{quest.title}</h4>
                                <p>{quest.description}</p>
                                <div className="quest-progress-bar-container">
                                    <div className="quest-progress-bar-fill" style={{width: `${(Math.min(progress, quest.targetQuantity) / quest.targetQuantity) * 100}%`}}></div>
                                </div>
                                <small>{Math.min(progress, quest.targetQuantity)} / {quest.targetQuantity}</small>
                            </div>
                            <button onClick={() => completeQuest(quest)} disabled={!isComplete}>완료</button>
                        </div>
                    )
                }) : <p>진행 중인 퀘스트가 없습니다.</p>}
            </div>
             <div className="quest-section">
                <h3>새로운 퀘스트</h3>
                {availableQuests.length > 0 ? availableQuests.map(quest => {
                    const canAccept = playerStats.level >= (quest.requiredLevel || 1);
                    return (
                        <div key={quest.id} className="card quest-card" style={{ opacity: canAccept ? 1 : 0.6 }}>
                             <div>
                                <h4>{quest.title} {!canAccept && `(Lv. ${quest.requiredLevel} 필요)`}</h4>
                                <p>{quest.description}</p>
                            </div>
                            <button onClick={() => acceptQuest(quest)} disabled={!canAccept}>
                                {canAccept ? '수락' : '레벨 부족'}
                            </button>
                        </div>
                    );
                }) : <p>수락할 수 있는 새로운 퀘스트가 없습니다. 레벨을 올리거나 다른 퀘스트를 완료하세요.</p>}
            </div>
        </div>
    );
};

const GachaShrineView = ({ playerStats, setPlayerStats, setView }) => {
    const [gachaResult, setGachaResult] = useState(null);

    const performGacha = (type) => {
        const cost = type === 'pet' ? PET_GACHA_COST : ITEM_GACHA_COST;
        if (playerStats.gold < cost) {
            alert('골드가 부족합니다.');
            return;
        }

        setPlayerStats(prev => ({...prev, gold: prev.gold - cost}));
        
        let drawnItem;
        if(type === 'pet') {
            const rand = Math.random();
            if(rand < 0.05) drawnItem = allPets.find(p => p.grade === ItemGrade.LEGENDARY);
            else if (rand < 0.25) drawnItem = allPets.find(p => p.grade === ItemGrade.EPIC);
            else drawnItem = allPets[Math.floor(Math.random() * 2)]; // Two rare pets
            
            const newPet = {
                ...drawnItem,
                id: Date.now() + Math.random(),
                enhancementLevel: 0,
                equipment: { armor: null }
            };
            setPlayerStats(prev => ({...prev, pets: [...prev.pets, newPet]}));
        } else { // item gacha
            const rand = Math.random();
            let gradeToDraw;
            if(rand < 0.01) gradeToDraw = ItemGrade.MYTHIC;
            else if (rand < 0.05) gradeToDraw = ItemGrade.LEGENDARY;
            else if (rand < 0.20) gradeToDraw = ItemGrade.EPIC;
            else if (rand < 0.50) gradeToDraw = ItemGrade.RARE;
            else gradeToDraw = ItemGrade.UNCOMMON;
            
            const itemsOfGrade = allItems.filter(i => i.grade === gradeToDraw && i.type !== ItemType.MATERIAL && i.type !== ItemType.CONSUMABLE);
            drawnItem = itemsOfGrade[Math.floor(Math.random() * itemsOfGrade.length)];

            setPlayerStats(prev => {
                const newInventory = [...prev.inventory];
                const existing = newInventory.find(i => i.id === drawnItem.id && !i.enhancementLevel);
                if (existing) existing.quantity++;
                else newInventory.push({...drawnItem, quantity: 1});
                return {...prev, inventory: newInventory};
            });
        }
        setGachaResult(drawnItem);
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <div className="gacha-shrine">
                <h2>뽑기 성소</h2>
                <p>운명을 시험하고 강력한 동료나 장비를 얻으세요!</p>
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0'}}>
                    <button onClick={() => performGacha('item')} disabled={playerStats.gold < ITEM_GACHA_COST}>아이템 뽑기 ({ITEM_GACHA_COST} G)</button>
                    <button onClick={() => performGacha('pet')} disabled={playerStats.gold < PET_GACHA_COST}>펫 뽑기 ({PET_GACHA_COST} G)</button>
                </div>
            </div>
            {gachaResult && (
                <div className="gacha-result" onClick={() => setGachaResult(null)}>
                    <div className="card">
                        <h2>획득!</h2>
                        <div className={`gacha-item-grade ${ItemGradeInfo[gachaResult.grade].class}`}>{ItemGradeInfo[gachaResult.grade].name}</div>
                        <div className="gacha-item-name">{gachaResult.name}</div>
                        <p>화면을 클릭하여 닫기</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const TownHallView = ({ playerStats, setPlayerStats, setView }) => {
    const currentLevelInfo = townLevels[playerStats.townLevel - 1];
    const nextLevelInfo = townLevels[playerStats.townLevel] || null;

    const handleUpgrade = () => {
        if (nextLevelInfo && playerStats.gold >= nextLevelInfo.costToUpgrade) {
            setPlayerStats(prev => ({
                ...prev,
                gold: prev.gold - nextLevelInfo.costToUpgrade,
                townLevel: prev.townLevel + 1
            }));
            alert('마을이 발전했습니다!');
        } else {
            alert('골드가 부족합니다.');
        }
    };
    
    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>마을 회관</h2>
            <h3>현재 마을 등급: {currentLevelInfo.name} (Lv. {playerStats.townLevel})</h3>
            <StatBar value={playerStats.townXp} maxValue={nextLevelInfo ? nextLevelInfo.xpRequired : currentLevelInfo.xpRequired} color="#ff9800" label="마을 XP" />
            {nextLevelInfo && nextLevelInfo.costToUpgrade !== Infinity ? (
                 <div className="town-hall-upgrade-info">
                    <h4>다음 등급으로 발전: {nextLevelInfo.name}</h4>
                    <p>필요 XP: {formatNumber(nextLevelInfo.xpRequired)}</p>
                    <p>필요 골드: {formatNumber(nextLevelInfo.costToUpgrade)} G</p>
                    <button onClick={handleUpgrade} disabled={playerStats.townXp < nextLevelInfo.xpRequired || playerStats.gold < nextLevelInfo.costToUpgrade}>
                        발전시키기
                    </button>
                </div>
            ) : <p>마을이 최대로 발전했습니다!</p>}
        </div>
    );
};

const TrophyRoadView = ({ playerStats, setPlayerStats, setView }) => {
    const handleClaim = (milestone) => {
         setPlayerStats(prev => {
            const newInventory = [...prev.inventory];
            let newGold = prev.gold;
            
            if (milestone.rewards.gold) newGold += milestone.rewards.gold;
            milestone.rewards.items?.forEach(itemReward => {
                const itemInfo = allItems.find(i => i.id === itemReward.itemId);
                const existing = newInventory.find(i => i.id === itemInfo.id && !i.enhancementLevel);
                if(existing) existing.quantity += itemReward.quantity;
                else newInventory.push({...itemInfo, quantity: itemReward.quantity});
            });

            return {
                ...prev,
                gold: newGold,
                inventory: newInventory,
                claimedTrophyRewards: [...prev.claimedTrophyRewards, milestone.trophies]
            };
         });
         alert('보상을 수령했습니다!');
    };

    return (
        <div className="card">
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>트로피 로드</h2>
            <p className="current-trophies">현재 트로피: {formatNumber(playerStats.trophies)} 🏆</p>
            <div className="trophy-road-list">
                {trophyRoadMilestones.map(milestone => {
                    const isUnlocked = playerStats.trophies >= milestone.trophies;
                    const isClaimed = playerStats.claimedTrophyRewards.includes(milestone.trophies);
                    return (
                        <div key={milestone.trophies} className={`trophy-milestone ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''}`}>
                            <div>
                                <h4>{formatNumber(milestone.trophies)} 트로피 달성 보상</h4>
                                {milestone.rewards.gold && <p>{formatNumber(milestone.rewards.gold)} 골드</p>}
                                {milestone.rewards.items?.map(item => <p key={item.itemId}>{allItems.find(i=>i.id === item.itemId)?.name} x{item.quantity}</p>)}
                            </div>
                            <button onClick={() => handleClaim(milestone)} disabled={!isUnlocked || isClaimed}>
                                {isClaimed ? '수령 완료' : '수령'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PetManagementView = ({ playerStats, setPlayerStats, setView }) => {
    const [selectedPet, setSelectedPet] = useState(null);
    const [showEquipModal, setShowEquipModal] = useState(false);

    const availablePetArmors = useMemo(() => {
        return playerStats.inventory.filter(i => i.type === ItemType.PET_ARMOR);
    }, [playerStats.inventory]);

    const handleSetActivePet = () => {
        if (selectedPet) {
            setPlayerStats(prev => ({ ...prev, activePetId: selectedPet.id }));
            alert(`${selectedPet.name}이(가) 전투에 참여합니다.`);
        }
    };
    
    const handleReleasePet = () => {
         if (selectedPet) {
            setPlayerStats(prev => ({ ...prev, activePetId: null }));
            alert(`${selectedPet.name}이(가) 휴식을 취합니다.`);
        }
    };

    const handleSellPet = (petToSell) => {
        if (!petToSell) return;
        if (petToSell.id === playerStats.activePetId) {
            alert('활성화된 펫은 판매할 수 없습니다.');
            return;
        }
        if (confirm(`${getDisplayName(petToSell)}을(를) ${petToSell.sellPrice} G에 판매하시겠습니까?`)) {
            setPlayerStats(prev => {
                const newPets = prev.pets.filter(p => p.id !== petToSell.id);
                const newGold = prev.gold + petToSell.sellPrice;
                return { ...prev, pets: newPets, gold: newGold };
            });
            setSelectedPet(null);
            alert(`${petToSell.name} 판매 완료.`);
        }
    };

    const handleEquipPetArmor = (armorToEquip) => {
        if (!selectedPet) return;

        setPlayerStats(prev => {
            const currentlyEquipped = selectedPet.equipment?.armor;
            let newInventory = [...prev.inventory];

            // Remove new armor from inventory
            const inventoryItemIndex = newInventory.findIndex(i => i.id === armorToEquip.id && (i.enhancementLevel || 0) === (armorToEquip.enhancementLevel || 0));
            if (inventoryItemIndex !== -1) {
                if (newInventory[inventoryItemIndex].quantity > 1) {
                    newInventory[inventoryItemIndex].quantity--;
                } else {
                    newInventory.splice(inventoryItemIndex, 1);
                }
            }

            // Add old armor back to inventory
            if (currentlyEquipped) {
                const existingStack = newInventory.find(i => i.id === currentlyEquipped.id && (i.enhancementLevel || 0) === (currentlyEquipped.enhancementLevel || 0));
                if (existingStack) {
                    existingStack.quantity++;
                } else {
                    newInventory.push({ ...currentlyEquipped, quantity: 1 });
                }
            }
            
            // Update pet
            const newPets = prev.pets.map(p => {
                if (p.id === selectedPet.id) {
                    return { ...p, equipment: { armor: armorToEquip } };
                }
                return p;
            });
            
            const updatedSelectedPet = newPets.find(p => p.id === selectedPet.id);
            setSelectedPet(updatedSelectedPet);

            return { ...prev, inventory: newInventory, pets: newPets };
        });
        
        setShowEquipModal(false);
    };

    const handleUnequipPetArmor = () => {
        if (!selectedPet || !selectedPet.equipment?.armor) return;
        const armorToUnequip = selectedPet.equipment.armor;

        setPlayerStats(prev => {
            const newInventory = [...prev.inventory];
            const existingStack = newInventory.find(i => i.id === armorToUnequip.id && (i.enhancementLevel || 0) === (armorToUnequip.enhancementLevel || 0));
            if (existingStack) {
                existingStack.quantity++;
            } else {
                newInventory.push({ ...armorToUnequip, quantity: 1 });
            }

            const newPets = prev.pets.map(p => {
                if (p.id === selectedPet.id) {
                    return { ...p, equipment: { armor: null } };
                }
                return p;
            });

            const updatedSelectedPet = newPets.find(p => p.id === selectedPet.id);
            setSelectedPet(updatedSelectedPet);

            return { ...prev, inventory: newInventory, pets: newPets };
        });
    };

    return (
        <div className="card">
             {showEquipModal && selectedPet && (
                <div className="modal-backdrop">
                    <div className="modal-content card">
                        <h3>{selectedPet.name}에게 장비 장착</h3>
                        <div className="inventory-list">
                            {availablePetArmors.length > 0 ? availablePetArmors.map(armor => (
                                <div key={`${armor.id}-${armor.enhancementLevel || 0}`} className="inventory-item">
                                    <span>
                                        <strong className={ItemGradeInfo[armor.grade]?.class}>{getDisplayName(armor)}</strong> (방어력: {armor.defense + (armor.enhancementLevel || 0)})
                                    </span>
                                    <button onClick={() => handleEquipPetArmor(armor)}>장착</button>
                                </div>
                            )) : <p>장착할 수 있는 펫 방어구가 없습니다.</p>}
                        </div>
                        <button onClick={() => setShowEquipModal(false)}>닫기</button>
                    </div>
                </div>
            )}
            <button onClick={() => setView(View.TOWN)}>마을로 돌아가기</button>
            <h2>반려동물 관리</h2>
            <div className="pet-management-view">
                <div className="pet-list-panel card">
                    <h3>보유한 펫</h3>
                    {playerStats.pets.length > 0 ? playerStats.pets.map(pet => (
                        <div 
                            key={pet.id} 
                            className={`pet-card ${selectedPet?.id === pet.id ? 'selected' : ''} ${playerStats.activePetId === pet.id ? 'active' : ''}`}
                            onClick={() => setSelectedPet(pet)}
                        >
                            <strong className={ItemGradeInfo[pet.grade].class}>{getDisplayName(pet)}</strong>
                        </div>
                    )) : <p>보유한 펫이 없습니다.</p>}
                </div>
                <div className="pet-details-panel card">
                    {selectedPet ? (
                        <>
                            <h3>{getDisplayName(selectedPet)} <span className={ItemGradeInfo[selectedPet.grade].class}>({ItemGradeInfo[selectedPet.grade].name})</span></h3>
                            <p>기본 공격력 보너스: +{selectedPet.attackBonus}</p>
                            <p>기본 방어력 보너스: +{selectedPet.defenseBonus}</p>
                            <hr/>
                            <p><strong>총 공격력 보너스: +{(selectedPet.attackBonus || 0) + ((selectedPet.enhancementLevel || 0) * 2)}</strong></p>
                            <p><strong>총 방어력 보너스: +{(selectedPet.defenseBonus || 0) + (selectedPet.enhancementLevel || 0) + (selectedPet.equipment?.armor?.defense || 0) + (selectedPet.equipment?.armor?.enhancementLevel || 0)}</strong></p>
                            <h4>스킬: {selectedPet.skillName}</h4>
                            <p>{selectedPet.skillDescription}</p>
                            <h4>장비</h4>
                            <p>펫 갑옷: <span className={selectedPet.equipment?.armor ? ItemGradeInfo[selectedPet.equipment.armor.grade].class : ''}>{getDisplayName(selectedPet.equipment?.armor)}</span></p>
                            <div className="pet-actions">
                                {playerStats.activePetId === selectedPet.id ? (
                                    <button onClick={handleReleasePet}>휴식</button>
                                ) : (
                                    <button onClick={handleSetActivePet}>활성화</button>
                                )}
                                 <button onClick={() => setShowEquipModal(true)}>장비 교체</button>
                                {selectedPet.equipment?.armor && <button onClick={handleUnequipPetArmor}>장비 해제</button>}
                                <button onClick={() => handleSellPet(selectedPet)} style={{backgroundColor: '#c62828'}} disabled={playerStats.activePetId === selectedPet.id}>
                                    판매 ({selectedPet.sellPrice} G)
                                </button>
                            </div>
                            {playerStats.activePetId === selectedPet.id && <small style={{display: 'block', marginTop: '5px'}}>활성화된 펫은 판매할 수 없습니다.</small>}
                        </>
                    ) : <p>펫을 선택하여 정보를 확인하세요.</p>}
                </div>
            </div>
        </div>
    );
};


const App = () => {
    const [playerStats, setPlayerStats] = useState(() => {
        const savedGame = localStorage.getItem('rpgGameState');
        const initialStats = getInitialPlayerStats();
        try {
            if (savedGame) {
                const loadedStats = JSON.parse(savedGame);
                // Simple fix: ensure pets have unique IDs and equipment slots upon loading old save data
                if (loadedStats.pets) {
                     loadedStats.pets = loadedStats.pets.map((pet, index) => ({
                        ...pet,
                        id: pet.id && pet.id > 100 ? pet.id : Date.now() + index,
                        equipment: pet.equipment || { armor: null }
                    }));
                }
                // Merge saved data with initial data to ensure new properties are present
                return { ...initialStats, ...loadedStats };
            }
        } catch (error) {
            console.error("Failed to parse saved game state:", error);
            // If parsing fails, start a new game
            return initialStats;
        }
        return initialStats;
    });
    const [view, setView] = useState(View.TOWN);
    const [currentDungeon, setCurrentDungeon] = useState(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);
    const [battleDifficulty, setBattleDifficulty] = useState('Medium');


    useEffect(() => {
        localStorage.setItem('rpgGameState', JSON.stringify(playerStats));
    }, [playerStats]);

    const resetGame = () => {
        if (window.confirm('정말로 모든 진행 상황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem('rpgGameState');
            setPlayerStats(getInitialPlayerStats());
            setView(View.TOWN);
            alert('게임이 초기화되었습니다.');
        }
    };

    const startBattle = (difficulty) => {
        setBattleDifficulty(difficulty);
        setView(View.BATTLE);
        setShowDifficultyModal(false);
    };

    const startDungeon = (dungeon) => {
        setCurrentDungeon(dungeon);
        setView(View.DUNGEON_BATTLE);
    };
    
    const endDungeon = (isCompleted) => {
        setCurrentDungeon(null);
        setView(View.TOWN);
    };

    const renderView = () => {
        switch (view) {
            case View.TOWN:
                return <TownView playerStats={playerStats} setView={setView} setShowDifficultyModal={setShowDifficultyModal} />;
            case View.PLAYER:
                return <PlayerStatsView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} resetGame={resetGame} />;
            case View.SHOP:
                return <ShopView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.BATTLE:
                return <BattleView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} difficulty={battleDifficulty} />;
            case View.CLASS_SELECTION:
                return <ClassSelectionView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            case View.DUNGEON:
                return <DungeonView setView={setView} setCurrentDungeon={startDungeon} />;
            case View.DUNGEON_BATTLE:
                return <DungeonBattleView dungeon={currentDungeon} playerStats={playerStats} setPlayerStats={setPlayerStats} endDungeon={endDungeon} />;
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
                 return <PetManagementView playerStats={playerStats} setPlayerStats={setPlayerStats} setView={setView} />;
            default:
                return <TownView playerStats={playerStats} setView={setView} setShowDifficultyModal={setShowDifficultyModal} />;
        }
    };

    return (
        <Fragment>
            {showDifficultyModal && (
                <div className="modal-backdrop">
                    <div className="modal-content card">
                        <h3>난이도 선택</h3>
                        <p>전투 난이도를 선택하세요.</p>
                        <div className="difficulty-buttons">
                            <button onClick={() => startBattle('Easy')}>쉬움</button>
                            <button onClick={() => startBattle('Medium')}>중간</button>
                            <button onClick={() => startBattle('Hard')}>어려움</button>
                        </div>
                        <button onClick={() => setShowDifficultyModal(false)} style={{marginTop: '20px'}}>취소</button>
                    </div>
                </div>
            )}
            {renderView()}
        </Fragment>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);