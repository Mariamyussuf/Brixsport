"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { ThemeProvider as SCThemeProvider, createGlobalStyle } from "styled-components";
import { useTheme } from "@/components/shared/ThemeProvider";

// Match states that combine both implementations
const MATCH_STATES = {
  DONE: 'SCORE_DONE',
  WALK_OVER: 'WALK_OVER',
  NO_SHOW: 'NO_SHOW',
  RUNNING: 'RUNNING',
  SCHEDULED: 'SCHEDULED'
};

// Enhanced theme system combining both implementations
const useBracketTheme = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return useMemo(
    () => ({
      palette: {
        background: isDark ? "#0b0f1a" : "#f7f7f7",
        surface: isDark ? "#111827" : "#ffffff",
        textPrimary: isDark ? "#e5e7eb" : "#111827",
        textSecondary: isDark ? "#9ca3af" : "#6b7280",
        line: isDark ? "#374151" : "#e5e7eb",
        accent: "#f97316", // Tailwind orange-500
        winner: isDark ? "#16a34a" : "#22c55e",
        scheduled: isDark ? "#4b5563" : "#9ca3af",
        running: isDark ? "#d97706" : "#f59e0b",
        done: isDark ? "#16a34a" : "#22c55e",
      },
      borderRadius: 12,
      match: {
        backgroundHover: isDark ? "#0f172a" : "#f9fafb",
        boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,0.6)"
          : "0 1px 2px rgba(0,0,0,0.08)",
      },
    }),
    [resolvedTheme]
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
  padding: 1rem;
  background: transparent;
`;

const EdgeFade = styled.div<{ side: "left" | "right" }>`
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  width: 28px;
  ${({ side }) => (side === "left" ? "left: 0;" : "right: 0;")}
  background: linear-gradient(
    to ${({ side }) => (side === "left" ? "right" : "left")},
    ${({ theme }) => theme.palette.surface},
    ${({ theme }) => theme.palette.surface}00
  );
`;

const GlobalLines = createGlobalStyle`
  /* soften connector lines */
  .svg-line {
    stroke: ${({ theme }) => theme.palette.line};
    opacity: 0.6;
  }

  /* Winner styling */
  .tournament-match-winner {
    position: relative;
    background-color: ${({ theme }) => theme.palette.winner}10 !important;
  }
  .tournament-match-winner::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: ${({ theme }) => theme.palette.winner};
    border-top-left-radius: ${({ theme }) => theme.borderRadius}px;
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius}px;
  }
`;

// Enhanced Match component combining both styles
const Match = ({ match, onMatchClick, onPartyClick }) => {
  const theme = useBracketTheme();
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer min-w-48"
      onClick={() => onMatchClick?.(match)}
    >
      {/* Match Header */}
      <div className="bg-blue-500 dark:bg-blue-600 text-white text-center py-2 rounded-t-lg">
        <div className="text-sm font-medium">{match.tournamentRoundText}</div>
        <div className="text-xs opacity-90">{match.name}</div>
      </div>

      {/* Participants */}
      <div className="p-3">
        {match.participants.map((participant, index) => (
          <div 
            key={participant.id}
            className={`flex justify-between items-center p-2 mb-1 rounded transition-colors ${
              participant.isWinner ? 'tournament-match-winner' : 'bg-gray-50 dark:bg-gray-900'
            } ${index === 0 ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}
            onClick={(e) => {
              e.stopPropagation();
              onPartyClick?.(participant, match);
            }}
          >
            <span className={`text-sm font-medium ${
              participant.isWinner ? 'text-green-800 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {participant.isWinner ? `🏆 ${participant.name}` : participant.name || 'TBD'}
            </span>
            <span className={`text-sm font-bold ${
              participant.isWinner ? 'text-green-800 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {participant.resultText || '–'}
            </span>
          </div>
        ))}
      </div>

      {/* Match Status */}
      <div className="px-3 pb-2">
        <div className={`text-xs text-center py-1 rounded ${
          match.state === MATCH_STATES.DONE ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
          match.state === MATCH_STATES.RUNNING ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
          'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
        }`}>
          {match.state === MATCH_STATES.DONE ? 'Completed' :
           match.state === MATCH_STATES.RUNNING ? 'In Progress' : 'Scheduled'}
        </div>
      </div>
    </div>
  );
};

// SVG Viewer with responsive handling
const SVGViewer = ({ children, width, height, background = 'transparent' }) => {
  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-inner">
      <svg width={width} height={height} style={{ background }}>
        <g>{children}</g>
      </svg>
    </div>
  );
};

export default function EnhancedBracketView() {
  const scTheme = useBracketTheme();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 1200, height: 600 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Observe container resize to keep SVG responsive
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const w = el.clientWidth;
      const svgWidth = Math.max(900, Math.round(w));
      const svgHeight = Math.max(420, Math.min(720, Math.round(svgWidth * 0.5)));
      setDims({ width: svgWidth, height: svgHeight });
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const onScroll = () => update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Enhanced tournament data with your existing matches
  const matches = useMemo(() => [
    {
      id: 1,
      name: "QF1",
      nextMatchId: 5,
      tournamentRoundText: "Quarterfinals",
      startTime: "2025-08-26",
      state: MATCH_STATES.DONE,
      participants: [
        { id: "QAT", name: "🇶🇦 QAT", resultText: "1", isWinner: false, status: "PLAYED" },
        { id: "ESP", name: "🇪🇸 ESP", resultText: "2", isWinner: true, status: "PLAYED" },
      ],
    },
    // ... Your existing matches data
  ], []);

  // Group matches by rounds
  const rounds = useMemo(() => {
    const roundMap = new Map();
    matches.forEach(match => {
      const round = match.tournamentRoundText;
      if (!roundMap.has(round)) {
        roundMap.set(round, []);
      }
      roundMap.get(round).push(match);
    });
    return Array.from(roundMap.entries()).map(([title, matches]) => ({
      title,
      matches
    }));
  }, [matches]);

  return (
    <SCThemeProvider theme={scTheme}>
      <GlobalLines />
      {/* Round headers */}
      <div className="px-4 pb-1">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(3, rounds.length)}, minmax(0, 1fr))` }}>
          {rounds.map((round) => (
            <div key={round.title} className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 text-center pb-1">
              {round.title}
            </div>
          ))}
        </div>
      </div>
      
      <Container ref={wrapperRef} className="bg-white dark:bg-gray-900">
        {canScrollLeft && <EdgeFade side="left" />}
        {canScrollRight && <EdgeFade side="right" />}
        <div className="relative min-w-[900px] mx-auto">
          <div className="flex gap-16">
            {rounds.map((round, roundIndex) => (
              <div key={round.title} className="flex-shrink-0">
                <div className="space-y-12" style={{ minWidth: '250px' }}>
                  {round.matches.map((match) => (
                    <Match
                      key={match.id}
                      match={match}
                      onMatchClick={(m) => setSelectedMatch(m)}
                      onPartyClick={(party, m) => console.log('Party clicked:', party, 'in match:', m)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Connection lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {rounds.map((round, roundIndex) => {
              if (roundIndex >= rounds.length - 1) return null;
              
              return round.matches.map((match, matchIndex) => {
                const currentRoundX = roundIndex * (250 + 64) + 250;
                const nextRoundX = currentRoundX + 64;
                const matchHeight = 200;
                const currentMatchY = 88 + (matchIndex * matchHeight);
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const nextMatchY = 88 + (nextMatchIndex * matchHeight * 2);
                const midX = currentRoundX + 32;
                
                return (
                  <g key={`connection-${round.title}-${match.id}`}>
                    <line
                      x1={currentRoundX}
                      y1={currentMatchY}
                      x2={midX}
                      y2={currentMatchY}
                      className="svg-line"
                      strokeWidth="2"
                    />
                    <line
                      x1={midX}
                      y1={currentMatchY}
                      x2={midX}
                      y2={nextMatchY}
                      className="svg-line"
                      strokeWidth="2"
                    />
                    {matchIndex % 2 === 0 && (
                      <line
                        x1={midX}
                        y1={nextMatchY}
                        x2={nextRoundX}
                        y2={nextMatchY}
                        className="svg-line"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              });
            })}
          </svg>
        </div>
      </Container>

      {/* Selected Match Info */}
      {selectedMatch && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{selectedMatch.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status: {selectedMatch.state}</p>
          <div className="space-y-1">
            {selectedMatch.participants.map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className={`${p.isWinner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {p.name}
                </span>
                <span>{p.resultText || '–'}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setSelectedMatch(null)}
            className="mt-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </SCThemeProvider>
  );
}
