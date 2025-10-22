import { Gun, Armor, Consumable, PlayerStats, EnemyStats } from './types';

export enum ItemType {
  Weapon = '무기',
  Armor = '방어구',
  Consumable = '소모품',
}

export const GUNS: Gun[] = [
  {
    id: 1,
    name: '플라즈마 소총',
    type: ItemType.Weapon,
    description: '에너지 셀을 사용하여 과열된 플라즈마를 발사하는 다목적 소총입니다.',
    price: 2500,
    image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3697669_1.jpeg',
    attack: 35,
    accuracy: 85,
    fireRate: 60,
    range: 70,
  },
  {
    id: 2,
    name: '레일건 저격총',
    type: ItemType.Weapon,
    description: '전자기력을 이용하여 발사체를 초고속으로 가속시켜 엄청난 관통력을 자랑합니다.',
    price: 4500,
    image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3697663_1.jpeg',
    attack: 80,
    accuracy: 95,
    fireRate: 15,
    range: 100,
  },
  {
    id: 3,
    name: '펄스 샷건',
    type: ItemType.Weapon,
    description: '근거리에서 넓은 범위에 충격파를 방출하여 여러 적을 동시에 공격할 수 있습니다.',
    price: 1800,
    image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3697651_1.jpeg',
    attack: 60,
    accuracy: 40,
    fireRate: 30,
    range: 25,
  },
  {
    id: 4,
    name: '이온 블래스터',
    type: ItemType.Weapon,
    description: '안정적인 연사력과 적당한 피해량을 가진 권총으로, 모든 상황에 유용합니다.',
    price: 950,
    image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3697675_1.jpeg',
    attack: 25,
    accuracy: 75,
    fireRate: 75,
    range: 50,
  },
];

export const ARMOR: Armor[] = [
    {
        id: 101,
        name: '나노 복합 아머',
        type: ItemType.Armor,
        description: '자동 회복 나노봇이 포함된 경량 아머로, 뛰어난 기동성과 방어력을 제공합니다.',
        price: 3200,
        image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3716281_1.jpeg',
        defense: 40,
    },
    {
        id: 102,
        name: '타이탄 강화 외골격',
        type: ItemType.Armor,
        description: '무거운 합금으로 제작되어 방어력은 극대화되었지만, 무게가 상당합니다.',
        price: 5000,
        image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3716269_1.jpeg',
        defense: 75,
    }
];

export const CONSUMABLES: Consumable[] = [
    {
        id: 201,
        name: '구급상자',
        type: ItemType.Consumable,
        description: '의료용 나노봇을 사용하여 즉시 체력을 50 회복합니다.',
        price: 500,
        image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3716317_1.jpeg',
        effect: 'heal',
        value: 50,
    },
    {
        id: 202,
        name: '전투 자극제',
        type: ItemType.Consumable,
        description: '아드레날린과 전투 약물을 주입하여 3턴 동안 공격력을 10 증가시킵니다.',
        price: 750,
        image: 'https://storage.googleapis.com/aistudio-marketplace-enterprise-archived-repo/f891018898314b4f5984a8528f108d3e8e1f7c2a71f76d479163b9f7a750058b/ appraised-art_3716305_1.jpeg',
        effect: 'boost_attack',
        value: 10,
        duration: 3,
    }
];

export const ALL_ITEMS = [...GUNS, ...ARMOR, ...CONSUMABLES];

export const INITIAL_PLAYER_STATS: PlayerStats = {
    maxHealth: 100,
    health: 100,
    attack: 5,
    defense: 0,
};

export const INITIAL_ENEMY_STATS: EnemyStats = {
    name: '훈련용 드론',
    maxHealth: 80,
    health: 80,
    attack: 20,
    defense: 10,
};
