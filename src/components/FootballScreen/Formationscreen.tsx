import React, { useState } from 'react';

interface Player {
  id: number;
  name: string;
  position: { x: number; y: number };
  isBooked?: boolean;
  isRed?: boolean;
  isCaptain?: boolean;
  isOnField: boolean;
  positionName?: string;
}

interface Team {
  name: string;
  formation: string;
  players: Player[];
  substitutes: Player[];
  color: string;
  shortName: string;
}

interface FormationTemplate {
  name: string;
  positions: { x: number; y: number; positionName: string }[];
}

const FootballFormation: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [team1Formation, setTeam1Formation] = useState('4-2-3-1');
  const [team2Formation, setTeam2Formation] = useState('4-3-3');
  const [showSubstitutes, setShowSubstitutes] = useState(false);

  // Formation templates with position names
  const formations: Record<string, FormationTemplate> = {
    '4-4-2': {
      name: '4-4-2',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 20, y: 18, positionName: 'LB' },
        { x: 40, y: 18, positionName: 'CB' },
        { x: 60, y: 18, positionName: 'CB' },
        { x: 80, y: 18, positionName: 'RB' },
        { x: 20, y: 32, positionName: 'LM' },
        { x: 40, y: 32, positionName: 'CM' },
        { x: 60, y: 32, positionName: 'CM' },
        { x: 80, y: 32, positionName: 'RM' },
        { x: 35, y: 46, positionName: 'ST' },
        { x: 65, y: 46, positionName: 'ST' }
      ]
    },
    '4-3-3': {
      name: '4-3-3',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 20, y: 18, positionName: 'LB' },
        { x: 40, y: 18, positionName: 'CB' },
        { x: 60, y: 18, positionName: 'CB' },
        { x: 80, y: 18, positionName: 'RB' },
        { x: 30, y: 32, positionName: 'CM' },
        { x: 50, y: 32, positionName: 'CM' },
        { x: 70, y: 32, positionName: 'CM' },
        { x: 25, y: 46, positionName: 'LW' },
        { x: 50, y: 46, positionName: 'ST' },
        { x: 75, y: 46, positionName: 'RW' }
      ]
    },
    '4-2-3-1': {
      name: '4-2-3-1',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 20, y: 18, positionName: 'LB' },
        { x: 40, y: 18, positionName: 'CB' },
        { x: 60, y: 18, positionName: 'CB' },
        { x: 80, y: 18, positionName: 'RB' },
        { x: 38, y: 28, positionName: 'CDM' },
        { x: 62, y: 28, positionName: 'CDM' },
        { x: 25, y: 38, positionName: 'LAM' },
        { x: 50, y: 38, positionName: 'CAM' },
        { x: 75, y: 38, positionName: 'RAM' },
        { x: 50, y: 48, positionName: 'ST' }
      ]
    },
    '3-4-3': {
      name: '3-4-3',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 30, y: 18, positionName: 'CB' },
        { x: 50, y: 18, positionName: 'CB' },
        { x: 70, y: 18, positionName: 'CB' },
        { x: 15, y: 32, positionName: 'LWB' },
        { x: 40, y: 32, positionName: 'CM' },
        { x: 60, y: 32, positionName: 'CM' },
        { x: 85, y: 32, positionName: 'RWB' },
        { x: 25, y: 46, positionName: 'LW' },
        { x: 50, y: 46, positionName: 'ST' },
        { x: 75, y: 46, positionName: 'RW' }
      ]
    },
    '3-4-1-2': {
      name: '3-4-1-2',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 25, y: 18, positionName: 'CB' },
        { x: 50, y: 18, positionName: 'CB' },
        { x: 75, y: 18, positionName: 'CB' },
        { x: 15, y: 28, positionName: 'LM' },
        { x: 38, y: 28, positionName: 'CM' },
        { x: 62, y: 28, positionName: 'CM' },
        { x: 85, y: 28, positionName: 'RM' },
        { x: 50, y: 38, positionName: 'CAM' },
        { x: 35, y: 46, positionName: 'ST' },
        { x: 65, y: 46, positionName: 'ST' }
      ]
    },
    '3-5-2': {
      name: '3-5-2',
      positions: [
        { x: 50, y: 8, positionName: 'GK' },
        { x: 25, y: 18, positionName: 'CB' },
        { x: 50, y: 18, positionName: 'CB' },
        { x: 75, y: 18, positionName: 'CB' },
        { x: 15, y: 32, positionName: 'LWB' },
        { x: 35, y: 32, positionName: 'CM' },
        { x: 50, y: 32, positionName: 'CM' },
        { x: 65, y: 32, positionName: 'CM' },
        { x: 85, y: 32, positionName: 'RWB' },
        { x: 35, y: 46, positionName: 'ST' },
        { x: 65, y: 46, positionName: 'ST' }
      ]
    }
  };

  // Real player names
  const fluminensePlayers = [
    { name: "Fábio", pos: "GK" },
    { name: "Samuel Xavier", pos: "RB" },
    { name: "Thiago Silva", pos: "CB", captain: true },
    { name: "Thiago Santos", pos: "CB" },
    { name: "Diogo Barbosa", pos: "LB" },
    { name: "André", pos: "CDM" },
    { name: "Martinelli", pos: "CDM" },
    { name: "Jhon Arias", pos: "CAM" },
    { name: "Paulo Henrique Ganso", pos: "CAM" },
    { name: "Marquinhos", pos: "RW" },
    { name: "Germán Cano", pos: "ST" }
  ];

  const fluminenseSubstitutes = [
    { name: "Vitor Eudes", pos: "GK" },
    { name: "Guga", pos: "RB" },
    { name: "Ignácio", pos: "CB" },
    { name: "Facundo Bernal", pos: "CM" },
    { name: "Nonato", pos: "CM" },
    { name: "Lima", pos: "LW" },
    { name: "Keno", pos: "LW" },
    { name: "John Kennedy", pos: "ST" },
    { name: "Isaac", pos: "ST" }
  ];

  const chelseaPlayers = [
    { name: "Robert Sanchez", pos: "GK" },
    { name: "Reece James", pos: "RB", captain: true },
    { name: "Thiago Silva", pos: "CB" },
    { name: "Levi Colwill", pos: "CB" },
    { name: "Ben Chilwell", pos: "LB" },
    { name: "Enzo Fernandez", pos: "CM" },
    { name: "Moisés Caicedo", pos: "CM" },
    { name: "Conor Gallagher", pos: "CM" },
    { name: "Cole Palmer", pos: "RW" },
    { name: "Nicolas Jackson", pos: "ST" },
    { name: "Raheem Sterling", pos: "LW" }
  ];

  const chelseaSubstitutes = [
    { name: "Đorđe Petrović", pos: "GK" },
    { name: "Malo Gusto", pos: "RB" },
    { name: "Axel Disasi", pos: "CB" },
    { name: "Romeo Lavia", pos: "CM" },
    { name: "Carney Chukwuemeka", pos: "CM" },
    { name: "Christopher Nkunku", pos: "CAM" },
    { name: "Mykhaylo Mudryk", pos: "LW" },
    { name: "Armando Broja", pos: "ST" },
    { name: "Ian Maatsen", pos: "LB" }
  ];

  // Generate team with real names
  const generateTeam = (
    name: string, 
    shortName: string, 
    color: string, 
    formation: string, 
    playerList: any[],
    substituteList: any[],
    isTeam2: boolean = false
  ): Team => {
    const formationTemplate = formations[formation];
    const positions = isTeam2 ? 
      formationTemplate.positions.map(pos => ({ ...pos, x: pos.x, y: 100 - pos.y })) : 
      formationTemplate.positions;
    
    const players: Player[] = positions.map((pos, index) => ({
      id: index + 1,
      name: playerList[index]?.name || `Player ${index + 1}`,
      position: { x: pos.x, y: pos.y },
      positionName: pos.positionName,
      isBooked: Math.random() > 0.8,
      isCaptain: playerList[index]?.captain || false,
      isOnField: true
    }));

    const substitutes: Player[] = substituteList.map((sub, index) => ({
      id: index + 12,
      name: sub.name,
      position: { x: 0, y: 0 },
      positionName: sub.pos,
      isBooked: Math.random() > 0.9,
      isCaptain: false,
      isOnField: false
    }));

    return { name, shortName, formation, color, players, substitutes };
  };

  const [team1, setTeam1] = useState(() => 
    generateTeam("Fluminense", "FLU", "#8B0000", team1Formation, fluminensePlayers, fluminenseSubstitutes)
  );
  
  const [team2, setTeam2] = useState(() => 
    generateTeam("Chelsea", "CHE", "#034694", team2Formation, chelseaPlayers, chelseaSubstitutes, true)
  );

  // Update teams when formation changes
  React.useEffect(() => {
    setTeam1(generateTeam("Fluminense", "FLU", "#8B0000", team1Formation, fluminensePlayers, fluminenseSubstitutes));
  }, [team1Formation]);

  React.useEffect(() => {
    setTeam2(generateTeam("Chelsea", "CHE", "#034694", team2Formation, chelseaPlayers, chelseaSubstitutes, true));
  }, [team2Formation]);

  const handleSubstitution = (teamNum: number, playerOut: Player, playerIn: Player) => {
    if (teamNum === 1) {
      const newPlayers = team1.players.map(p => 
        p.id === playerOut.id ? { ...playerIn, position: p.position, isOnField: true } : p
      );
      const newSubs = team1.substitutes.map(s =>
        s.id === playerIn.id ? { ...playerOut, isOnField: false } : s
      );
      setTeam1({ ...team1, players: newPlayers, substitutes: newSubs });
    } else {
      const newPlayers = team2.players.map(p => 
        p.id === playerOut.id ? { ...playerIn, position: p.position, isOnField: true } : p
      );
      const newSubs = team2.substitutes.map(s =>
        s.id === playerIn.id ? { ...playerOut, isOnField: false } : s
      );
      setTeam2({ ...team2, players: newPlayers, substitutes: newSubs });
    }
  };

  const toggleCaptain = (teamNum: number, playerId: number) => {
    if (teamNum === 1) {
      const newPlayers = team1.players.map(p => ({
        ...p,
        isCaptain: p.id === playerId ? !p.isCaptain : false
      }));
      setTeam1({ ...team1, players: newPlayers });
    } else {
      const newPlayers = team2.players.map(p => ({
        ...p,
        isCaptain: p.id === playerId ? !p.isCaptain : false
      }));
      setTeam2({ ...team2, players: newPlayers });
    }
  };

  const PlayerCircle: React.FC<{ 
    player: Player; 
    team: Team;
    teamNum: number;
    onClick: () => void;
  }> = ({ player, team, teamNum, onClick }) => (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{
        left: `${player.position.x}%`,
        top: `${player.position.y}%`,
      }}
      onClick={onClick}
    >
      <div
        className={`relative w-6 h-6 sm:w-11 sm:h-11 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-[6px] sm:text-xs transition-all duration-300 hover:scale-110 shadow-lg ${
          selectedPlayer?.id === player.id && selectedPlayer.name === player.name ? 'ring-2 sm:ring-3 ring-yellow-300 ring-offset-1 sm:ring-offset-2 dark:ring-offset-gray-800' : ''
        }`}
        style={{ backgroundColor: team.color }}
      >
        {player.id}
        
        {player.isBooked && !player.isRed && (
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2.5 sm:h-3 bg-yellow-400 rounded-sm border border-yellow-600 dark:border-yellow-300"></div>
        )}
        {player.isRed && (
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2.5 sm:h-3 bg-red-500 rounded-sm border border-red-700 dark:border-red-300"></div>
        )}
        {player.isCaptain && (
          <div className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 w-2.5 h-1.5 sm:w-4 sm:h-2 bg-red-600 rounded-sm text-[5px] sm:text-[8px] flex items-center justify-center text-white font-bold">C</div>
        )}
      </div>
      
      {/* Player name always visible */}
      <div className="absolute top-7 sm:top-12 left-1/2 transform -translate-x-1/2 text-white text-[6px] sm:text-[10px] font-medium text-center whitespace-nowrap bg-black/60 dark:bg-black/80 px-1 py-0.5 rounded">
        {player.name.split(' ').pop()}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow-2xl rounded-none sm:rounded-2xl overflow-hidden">
      {/* Formation Selectors */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b dark:border-gray-700 px-2 sm:px-6 py-3 sm:py-4">
        <div className="text-center text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">Formation Builder & Team Manager</div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div 
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md"
              style={{ backgroundColor: team1.color }}
            >
              {team1.shortName[0]}
            </div>
            <select 
              value={team1Formation}
              onChange={(e) => setTeam1Formation(e.target.value)}
              className="w-full text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
            >
              {Object.keys(formations).map(formation => (
                <option key={formation} value={formation} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{formation}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">TACTICAL SETUP</div>
            <button
              onClick={() => setShowSubstitutes(!showSubstitutes)}
              className="text-[10px] sm:text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full transition-colors"
            >
              {showSubstitutes ? 'Hide Bench' : 'Show Bench'}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <select 
              value={team2Formation}
              onChange={(e) => setTeam2Formation(e.target.value)}
              className="w-full text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
            >
              {Object.keys(formations).map(formation => (
                <option key={formation} value={formation} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{formation}</option>
              ))}
            </select>
            <div 
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md"
              style={{ backgroundColor: team2.color }}
            >
              {team2.shortName[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Team Headers */}
      <div className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 px-2 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg"
              style={{ backgroundColor: team1.color }}
            >
              {team1.shortName}
            </div>
            <div className="text-center sm:text-left">
              <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">{team1.name}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{team1.formation} Formation</div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 font-medium bg-gray-200 dark:bg-gray-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">STARTING LINEUPS</div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-center sm:text-right">
              <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">{team2.name}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{team2.formation} Formation</div>
            </div>
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg"
              style={{ backgroundColor: team2.color }}
            >
              {team2.shortName}
            </div>
          </div>
        </div>
      </div>

      {/* Field */}
      <div className="relative bg-green-500 dark:bg-green-600 p-1 sm:p-4" style={{ aspectRatio: '5/6' }}>
        <div className="absolute inset-1 sm:inset-4 bg-gradient-to-b from-green-400 via-green-500 to-green-600 dark:from-green-500 dark:via-green-600 dark:to-green-700 rounded-lg"></div>
        <div 
          className="absolute inset-1 sm:inset-4 opacity-20 rounded-lg"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)`,
          }}
        ></div>

        {/* Field markings */}
        <svg className="absolute inset-1 sm:inset-4 w-full h-full" viewBox="0 0 400 480" preserveAspectRatio="none">
          <rect x="10" y="10" width="380" height="460" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" rx="6"/>
          <line x1="10" y1="240" x2="390" y2="240" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <circle cx="200" cy="240" r="60" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <circle cx="200" cy="240" r="4" fill="rgba(255,255,255,0.9)"/>
          <rect x="100" y="10" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <rect x="100" y="390" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <rect x="150" y="10" width="100" height="35" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <rect x="150" y="435" width="100" height="35" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
          <circle cx="200" cy="75" r="4" fill="rgba(255,255,255,0.9)"/>
          <circle cx="200" cy="405" r="4" fill="rgba(255,255,255,0.9)"/>
        </svg>

        {/* Team labels */}
        <div className="absolute top-2 sm:top-8 left-2 sm:left-8 bg-black/50 dark:bg-black/70 text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold backdrop-blur-sm">
          {team1.shortName} - {team1.formation}
        </div>
        <div className="absolute bottom-2 sm:bottom-8 right-2 sm:right-8 bg-black/50 dark:bg-black/70 text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold backdrop-blur-sm">
          {team2.shortName} - {team2.formation}
        </div>

        {/* Players */}
        {team1.players.map((player) => (
          <PlayerCircle
            key={`${team1.shortName}-${player.id}`}
            player={player}
            team={team1}
            teamNum={1}
            onClick={() => setSelectedPlayer({ ...player, name: `${player.name} (${team1.shortName})` })}
          />
        ))}
        
        {team2.players.map((player) => (
          <PlayerCircle
            key={`${team2.shortName}-${player.id}`}
            player={player}
            team={team2}
            teamNum={2}
            onClick={() => setSelectedPlayer({ ...player, name: `${player.name} (${team2.shortName})` })}
          />
        ))}
      </div>

      {/* Substitutes Panel */}
      {showSubstitutes && (
        <div className="bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 px-2 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-2 sm:mb-3">🔄 {team1.name} Substitutes</h3>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {team1.substitutes.map((sub) => (
                  <div key={sub.id} className="bg-white dark:bg-gray-600 p-1.5 sm:p-2 rounded border dark:border-gray-500 text-[10px] sm:text-xs">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{sub.name}</div>
                    <div className="text-gray-500 dark:text-gray-300">{sub.positionName}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-2 sm:mb-3">🔄 {team2.name} Substitutes</h3>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {team2.substitutes.map((sub) => (
                  <div key={sub.id} className="bg-white dark:bg-gray-600 p-1.5 sm:p-2 rounded border dark:border-gray-500 text-[10px] sm:text-xs">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{sub.name}</div>
                    <div className="text-gray-500 dark:text-gray-300">{sub.positionName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 px-2 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[10px] sm:text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-2.5 sm:h-3 bg-yellow-400 rounded-sm border border-yellow-600 dark:border-yellow-300"></div>
            <span>Yellow Card</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-2.5 sm:h-3 bg-red-500 rounded-sm border border-red-700 dark:border-red-300"></div>
            <span>Red Card</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-red-600 rounded-sm text-[6px] sm:text-[8px] flex items-center justify-center text-white font-bold">C</div>
            <span>Captain</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-[9px] sm:text-xs">• Click players for details</div>
        </div>
      </div>

      {/* Selected player info */}
      {selectedPlayer && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700 px-2 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100">{selectedPlayer.name}</div>
              <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                #{selectedPlayer.id} • {selectedPlayer.positionName}
                {selectedPlayer.isBooked && " • ⚠️ Booked"}
                {selectedPlayer.isCaptain && " • 👑 Captain"}
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => {
                  const teamNum = selectedPlayer.name.includes('FLU') ? 1 : 2;
                  toggleCaptain(teamNum, selectedPlayer.id);
                }}
                className="text-[10px] sm:text-xs bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-2 py-1 sm:px-3 sm:py-1 rounded transition-colors"
              >
                {selectedPlayer.isCaptain ? 'Remove Captain' : 'Make Captain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FootballFormation;