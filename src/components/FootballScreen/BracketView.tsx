"use client";
import React, { useMemo } from "react";
import { SingleEliminationBracket, Match, SVGViewer } from "@g-loot/react-tournament-brackets";
import styled, { ThemeProvider as SCThemeProvider, createGlobalStyle } from "styled-components";
import { useTheme } from "@/components/shared/ThemeProvider";

// Map our app theme (Tailwind/dark class) to a styled-components theme
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
  width: 100%;
  overflow-x: auto;
  padding: 1rem;
  background: transparent;
`;

const GlobalLines = createGlobalStyle`
  /* soften connector lines */
  .svg-line {
    stroke: ${({ theme }) => theme.palette.line};
    opacity: 0.6;
  }
`;

// Minimal demo data; wire from props later if needed
const demoMatches = [
  {
    id: 1,
    name: "QF1",
    nextMatchId: 5,
    tournamentRoundText: "Quarterfinals",
    startTime: "2025-08-26",
    state: "SCORE_DONE",
    participants: [
      { id: "QAT", name: "QAT", resultText: "1", isWinner: false, status: "PLAYED" },
      { id: "ESP", name: "ESP", resultText: "2", isWinner: true, status: "PLAYED" },
    ],
  },
  {
    id: 2,
    name: "QF2",
    nextMatchId: 5,
    tournamentRoundText: "Quarterfinals",
    startTime: "2025-08-26",
    state: "SCORE_DONE",
    participants: [
      { id: "GER", name: "GER", resultText: "0", isWinner: false, status: "PLAYED" },
      { id: "FRA", name: "FRA", resultText: "1", isWinner: true, status: "PLAYED" },
    ],
  },
  {
    id: 3,
    name: "QF3",
    nextMatchId: 6,
    tournamentRoundText: "Quarterfinals",
    startTime: "2025-08-26",
    state: "SCORE_DONE",
    participants: [
      { id: "BRA", name: "BRA", resultText: "3", isWinner: true, status: "PLAYED" },
      { id: "ARG", name: "ARG", resultText: "2", isWinner: false, status: "PLAYED" },
    ],
  },
  {
    id: 4,
    name: "QF4",
    nextMatchId: 6,
    tournamentRoundText: "Quarterfinals",
    startTime: "2025-08-26",
    state: "SCORE_DONE",
    participants: [
      { id: "ENG", name: "ENG", resultText: "2", isWinner: true, status: "PLAYED" },
      { id: "NED", name: "NED", resultText: "0", isWinner: false, status: "PLAYED" },
    ],
  },
  {
    id: 5,
    name: "SF1",
    nextMatchId: 7,
    tournamentRoundText: "Semifinals",
    startTime: "2025-08-27",
    state: "SCHEDULED",
    participants: [
      { id: "W1", name: "ESP", resultText: null, isWinner: false, status: "NO_SHOW" },
      { id: "W2", name: "FRA", resultText: null, isWinner: false, status: "NO_SHOW" },
    ],
  },
  {
    id: 6,
    name: "SF2",
    nextMatchId: 7,
    tournamentRoundText: "Semifinals",
    startTime: "2025-08-27",
    state: "SCHEDULED",
    participants: [
      { id: "W3", name: "BRA", resultText: null, isWinner: false, status: "NO_SHOW" },
      { id: "W4", name: "ENG", resultText: null, isWinner: false, status: "NO_SHOW" },
    ],
  },
  {
    id: 7,
    name: "Final",
    nextMatchId: null,
    tournamentRoundText: "Final",
    startTime: "2025-08-28",
    state: "SCHEDULED",
    participants: [
      { id: "W5", name: "Winner SF1", resultText: null, isWinner: false, status: "NO_SHOW" },
      { id: "W6", name: "Winner SF2", resultText: null, isWinner: false, status: "NO_SHOW" },
    ],
  },
];

export default function BracketView() {
  const scTheme = useBracketTheme();

  return (
    <SCThemeProvider theme={scTheme}>
      <GlobalLines />
      <Container className="bg-white dark:bg-black">
        <div className="min-w-[900px] mx-auto">
          <SVGViewer width={1200} height={600} background={"transparent"}>
            <SingleEliminationBracket
              matches={demoMatches as any}
              matchComponent={Match}
            />
          </SVGViewer>
        </div>
      </Container>
    </SCThemeProvider>
  );
}
