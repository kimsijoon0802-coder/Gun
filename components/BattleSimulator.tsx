import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, EnemyStats } from '../types';
import { INITIAL_ENEMY_STATS } from '../constants';
import StatBar from './StatBar';

interface BattleSimulatorProps {
  playerStats: PlayerStats;
}

const BattleSimulator: React.FC<BattleSimulatorProps> = ({ playerStats }) => {
  const [enemy, setEnemy] = useState<EnemyStats>({ ...INITIAL_ENEMY_STATS });
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isBattleOver, setIsBattleOver] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);

  const startBattle = () => {
    let currentPlayerHealth = playerStats.health;
    let currentEnemyHealth = INITIAL_ENEMY_STATS.health;
    const newLog: string[] = ['전투 시작!'];

    setEnemy({ ...INITIAL_ENEMY_STATS });
    setIsBattleOver(false);
    setWinner(null);

    const battleTurn = () => {
      // Player's turn
      const playerDamage = Math.max(1, playerStats.attack - enemy.defense);
      currentEnemyHealth -= playerDamage;
      newLog.push(`플레이어가 ${enemy.name}에게 ${playerDamage}의 피해를 입혔습니다! (적 체력: ${Math.max(0, currentEnemyHealth)})`);
      
      if (currentEnemyHealth <= 0) {
        newLog.push('플레이어 승리!');
        setWinner('플레이어');
        endBattle(newLog, currentPlayerHealth, 0);
        return;
      }

      // Enemy's turn
      const enemyDamage = Math.max(1, enemy.attack - playerStats.defense);
      currentPlayerHealth -= enemyDamage;
      newLog.push(`${enemy.name}이(가) 플레이어에게 ${enemyDamage}의 피해를 입혔습니다! (플레이어 체력: ${Math.max(0, currentPlayerHealth)})`);

      if (currentPlayerHealth <= 0) {
        newLog.push('적 승리!');
        setWinner(enemy.name);
        endBattle(newLog, 0, currentEnemyHealth);
        return;
      }
      
      setBattleLog([...newLog]);
      setEnemy(prev => ({ ...prev, health: currentEnemyHealth }));
      // This is a simplified update for the UI; the simulation uses the local variables.
      // In a real game, you would update the main player stats state.

      setTimeout(battleTurn, 500);
    };

    setTimeout(battleTurn, 500);
  };
  
  const endBattle = (finalLog: string[], finalPlayerHealth: number, finalEnemyHealth: number) => {
    setBattleLog(finalLog);
    setEnemy(prev => ({ ...prev, health: finalEnemyHealth }));
    setIsBattleOver(true);
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
      <h3 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-wider">전투 시뮬레이터</h3>
      
      <div className="mb-4 p-4 bg-black/30 rounded-lg">
        <h4 className="font-bold text-center text-red-400">{enemy.name}</h4>
        <StatBar label="체력" value={enemy.health} max={enemy.maxHealth} color="bg-red-500"/>
      </div>

      <div ref={logContainerRef} className="h-48 bg-black/30 rounded-md p-3 text-sm overflow-y-auto mb-4 border border-gray-700">
        {battleLog.map((log, index) => (
          <p key={index} className="font-mono text-gray-300">{log}</p>
        ))}
        {isBattleOver && winner && (
            <p className="font-bold text-yellow-300 mt-2 text-center">{winner}의 승리!</p>
        )}
      </div>

      <button
        onClick={startBattle}
        disabled={!isBattleOver}
        className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
      >
        전투 시작
      </button>
    </div>
  );
};

export default BattleSimulator;
