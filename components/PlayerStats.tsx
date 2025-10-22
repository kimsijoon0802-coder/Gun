import React from 'react';
import { PlayerStats as PlayerStatsType, Gun, Armor } from '../types';
import StatBar from './StatBar';

interface PlayerStatsProps {
  stats: PlayerStatsType;
  weapon: Gun | null;
  armor: Armor | null;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ stats, weapon, armor }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
      <h3 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-wider">플레이어 정보</h3>
      <div className="space-y-4">
        <StatBar label="체력" value={stats.health} max={stats.maxHealth} />
        <div>
          <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">공격력: <span className="text-white">{stats.attack}</span></p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">방어력: <span className="text-white">{stats.defense}</span></p>
        </div>
        
        <div className="pt-4 border-t border-cyan-500/20">
            <h4 className="font-bold text-cyan-200 mb-2">장비</h4>
            <div className="space-y-2 text-sm">
                <p>무기: <span className="text-gray-300">{weapon?.name ?? '없음'}</span></p>
                <p>방어구: <span className="text-gray-300">{armor?.name ?? '없음'}</span></p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
