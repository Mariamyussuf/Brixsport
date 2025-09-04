import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../../../types/campus';
import { campusDesign } from '../../../styles/campusDesign';
import { FixedSizeList as List, FixedSizeGrid as Grid } from 'react-window';

export interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
  teamColor?: string;
  disabled?: boolean;
  placeholder?: string;
  maxHeight?: string;
  showSearch?: boolean;
  variant?: 'dropdown' | 'grid' | 'list' | 'compact';
  allowDeselect?: boolean;
  groupBy?: 'position' | 'status' | 'team' | 'college' | 'department' | null;
}

/**
 * Enhanced PlayerSelector: Adaptive, accessible, and feature-rich player selection
 * - Smart responsive design with multiple variants
 * - Built-in search and filtering (name, college, department)
 * - College and department display across all variants
 * - Keyboard navigation and accessibility
 * - Smooth animations and micro-interactions
 * - Position-based grouping
 * - Virtual scrolling for large datasets
 */
export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onSelect,
  teamColor = '#2563eb',
  disabled = false,
  placeholder = 'Select a player...',
  maxHeight = '320px',
  showSearch = true,
  variant = 'dropdown',
  allowDeselect = true,
  groupBy = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  // Enhanced filter - now includes college and department
  const filteredPlayers = players.filter(player => {
    const searchLower = searchTerm.toLowerCase();
    return (
      player.name.toLowerCase().includes(searchLower) ||
      player.number?.toString().includes(searchTerm) ||
      player.position?.toLowerCase().includes(searchLower) ||
      player.college?.toLowerCase().includes(searchLower) ||
      player.department?.toLowerCase().includes(searchLower) ||
      player.team?.toLowerCase().includes(searchLower)
    );
  });

  const groupedPlayers = groupBy ? 
    filteredPlayers.reduce((acc, player) => {
      let key: string;
      if (groupBy === 'team') {
        key = player.team || 'No Team';
      } else if (groupBy === 'position') {
        key = player.position || 'No Position';
      } else if (groupBy === 'college') {
        key = player.college || 'No College';
      } else if (groupBy === 'department') {
        key = player.department || 'No Department';
      } else if (groupBy === 'status') {
        if (player.injured) key = 'Injured';
        else if (player.suspended) key = 'Suspended';
        else if (player.captain) key = 'Captains';
        else key = 'Active';
      } else {
        key = player[groupBy] || 'Other';
      }
      
      if (!acc[key]) {
        acc[key] = {
          players: [],
          teamColor: player.teamColor || teamColor,
          teamId: player.teamId
        };
      }
      acc[key].players.push(player);
      return acc;
    }, {} as Record<string, { players: Player[]; teamColor: string; teamId?: string }>) : 
    { 'All Players': { players: filteredPlayers, teamColor, teamId: undefined } };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, showSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredPlayers.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredPlayers.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(filteredPlayers[focusedIndex].id);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelect = (playerId: string) => {
    if (selectedPlayerId === playerId && allowDeselect) {
      onSelect('');
    } else {
      onSelect(playerId);
    }
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const getPlayerInitials = (player: Player) => {
    if (player.number) return player.number.toString();
    return player.name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const getPlayerColor = (player: Player) => {
    // Use team color if available, otherwise fall back to status-based color
    if (player.teamColor) return player.teamColor;
    if (player.injured) return '#ef4444';
    if (player.suspended) return '#f59e0b';
    return teamColor;
  };

  const getPlayerStatus = (player: Player) => {
    if (player.injured) return { color: '#ef4444', label: 'Injured' };
    if (player.suspended) return { color: '#f59e0b', label: 'Suspended' };
    if (player.captain) return { color: player.teamColor || teamColor, label: 'Captain' };
    return { color: player.teamColor || teamColor, label: 'Active' };
  };

  
  if (variant === 'dropdown') {
    return (
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          className={`
            w-full flex items-center justify-between px-4 py-3 
            bg-white border-2 rounded-xl text-left font-medium
            transition-all duration-200 ease-in-out
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400 focus:border-blue-500'}
            ${campusDesign.focus}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            {selectedPlayer ? (
              <>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getPlayerColor(selectedPlayer) }}
                >
                  {getPlayerInitials(selectedPlayer)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">{selectedPlayer.name}</span>
                    {selectedPlayer.position && (
                      <span className="text-gray-500 text-sm">{selectedPlayer.position}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {selectedPlayer.college && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {selectedPlayer.college}
                      </span>
                    )}
                    {selectedPlayer.department && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {selectedPlayer.department}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {showSearch && (
              <div className="p-3 border-b border-gray-100">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by name, college, department..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {allowDeselect && selectedPlayerId && (
                <button
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                  onClick={() => handleSelect('')}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-gray-600">Clear selection</span>
                </button>
              )}
              
              {Object.entries(groupedPlayers).map(([group, groupData]) => (
                <div key={group}>
                  {groupBy && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      {groupBy === 'team' && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: groupData.teamColor }}
                        />
                      )}
                      <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{group}</span>
                      <span className="text-xs text-gray-500">({groupData.players.length})</span>
                    </div>
                  )}
                  
                  {groupData.players.map((player, index) => {
                    const isSelected = player.id === selectedPlayerId;
                    const isFocused = focusedIndex === filteredPlayers.indexOf(player);
                    const status = getPlayerStatus(player);
                    
                    return (
                      <button
                        key={player.id}
                        className={`
                          w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150
                          ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900 hover:bg-gray-50'}
                          ${isFocused ? 'bg-blue-50' : ''}
                          ${player.injured || player.suspended ? 'opacity-75' : ''}
                        `}
                        onClick={() => handleSelect(player.id)}
                        onMouseEnter={() => setHoveredId(player.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm relative"
                          style={{ backgroundColor: status.color }}
                        >
                          {getPlayerInitials(player)}
                          {player.captain && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {(player.injured || player.suspended) && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                {player.injured ? 'Injured' : 'Suspended'}
                              </span>
                            )}
                            {groupBy !== 'team' && player.team && (
                              <span 
                                className="text-xs px-2 py-1 rounded-full text-white"
                                style={{ backgroundColor: player.teamColor || teamColor }}
                              >
                                {player.team}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {player.position && <span>{player.position}</span>}
                            {player.position && player.number && <span>•</span>}
                            {player.number && <span>#{player.number}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {player.college && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {player.college}
                              </span>
                            )}
                            {player.department && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {player.department}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              
              {filteredPlayers.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  No players found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid variant - mobile-first responsive
  if (variant === 'grid') {
    const columnCount = 4; // lg:grid-cols-4
    const rowCount = Math.ceil(filteredPlayers.length / columnCount);
    const itemHeight = 120;
    const itemWidth = 220;
    const GridItem = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const idx = rowIndex * columnCount + columnIndex;
      if (idx >= filteredPlayers.length) return null;
      const player = filteredPlayers[idx];
      const isSelected = player.id === selectedPlayerId;
      const playerColor = getPlayerColor(player);
      return (
        <button
          key={player.id}
          style={style}
          className={`
            flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
            ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-300 bg-white hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${campusDesign.focus}
          `}
          onClick={() => !disabled && handleSelect(player.id)}
          disabled={disabled}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative"
            style={{ backgroundColor: playerColor }}
          >
            {getPlayerInitials(player)}
            {player.captain && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="text-center space-y-2">
            <div className="font-medium text-sm">{player.name}</div>
            <div className="text-xs text-gray-500 space-x-1">
              {player.position && <span>{player.position}</span>}
              {player.position && player.number && <span>•</span>}
              {player.number && <span>#{player.number}</span>}
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {player.college && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {player.college}
                </span>
              )}
              {player.department && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {player.department}
                </span>
              )}
            </div>
            {player.team && (
              <div 
                className="text-xs px-2 py-1 rounded-full text-white inline-block"
                style={{ backgroundColor: playerColor }}
              >
                {player.team}
              </div>
            )}
          </div>
          {(player.injured || player.suspended) && (
            <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
              {player.injured ? 'Injured' : 'Suspended'}
            </div>
          )}
        </button>
      );
    };
    return (
      <div className="w-full">
        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, college, department..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
        {filteredPlayers.length > 30 ? (
          <Grid
            columnCount={columnCount}
            rowCount={rowCount}
            columnWidth={itemWidth}
            rowHeight={itemHeight}
            height={Math.min(3, rowCount) * itemHeight + 2}
            width={Math.min(columnCount, filteredPlayers.length) * itemWidth + 2}
            style={{ maxWidth: '100%', margin: '0 auto' }}
          >
            {GridItem}
          </Grid>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPlayers.map((player, idx) => GridItem({ columnIndex: idx % columnCount, rowIndex: Math.floor(idx / columnCount), style: {} }))}
          </div>
        )}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No players found matching "{searchTerm}"
          </div>
        )}
      </div>
    );
  }

  // List variant
  if (variant === 'list') {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const player = filteredPlayers[index];
      const isSelected = player.id === selectedPlayerId;
      const playerColor = getPlayerColor(player);
      return (
        <button
          key={player.id}
          style={style}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
            ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white hover:border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${campusDesign.focus}
          `}
          onClick={() => !disabled && handleSelect(player.id)}
          disabled={disabled}
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative"
            style={{ backgroundColor: playerColor }}
          >
            {getPlayerInitials(player)}
            {player.captain && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{player.name}</span>
              {(player.injured || player.suspended) && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                  {player.injured ? 'Injured' : 'Suspended'}
                </span>
              )}
              {player.team && (
                <span 
                  className="text-xs px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: playerColor }}
                >
                  {player.team}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {player.position && <span>{player.position}</span>}
              {player.position && player.number && <span>•</span>}
              {player.number && <span>#{player.number}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {player.college && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {player.college}
                </span>
              )}
              {player.department && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {player.department}
                </span>
              )}
            </div>
          </div>
          {isSelected && (
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      );
    };
    return (
      <div className="w-full">
        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, college, department..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
        {filteredPlayers.length > 30 ? (
          <List
            height={parseInt(maxHeight, 10) || 320}
            itemCount={filteredPlayers.length}
            itemSize={64}
            width="100%"
            style={{ maxHeight }}
          >
            {Row}
          </List>
        ) : (
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
            {filteredPlayers.map((player, idx) => Row({ index: idx, style: {} }))}
          </div>
        )}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No players found matching "{searchTerm}"
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  return (
    <div className="w-full">
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, college, department..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {filteredPlayers.map((player) => {
          const isSelected = player.id === selectedPlayerId;
          const playerColor = getPlayerColor(player);
          
          return (
            <button
              key={player.id}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200
                ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-300 bg-white hover:border-gray-400'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${campusDesign.focus}
              `}
              style={{ borderColor: isSelected ? playerColor : undefined }}
              onClick={() => !disabled && handleSelect(player.id)}
              disabled={disabled}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: playerColor }}
              >
                {getPlayerInitials(player)}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{player.name}</span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {player.college && <span>{player.college}</span>}
                  {player.college && player.department && <span>•</span>}
                  {player.department && <span>{player.department}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No players found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};