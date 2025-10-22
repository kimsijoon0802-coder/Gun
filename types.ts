import { ItemType } from './constants';

// FIX: Export ItemType so other modules can import it from this file.
export { ItemType };

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  description: string;
  price: number;
  image: string;
}

export interface Gun extends Item {
  type: ItemType.Weapon;
  attack: number;
  accuracy: number;
  fireRate: number;
  range: number;
}

export interface Armor extends Item {
  type: ItemType.Armor;
  defense: number;
}

export interface Consumable extends Item {
  type: ItemType.Consumable;
  effect: 'heal' | 'boost_attack';
  value: number;
  duration?: number; // in turns
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
}

export interface EnemyStats {
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    name: string;
}