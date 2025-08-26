"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

  /* Winner styling (depends on library internal class names) */
  .rtb-participant--winner {
    position: relative;
    background-color: ${({ theme }) => (theme.palette.winner)}10 !important;
  }
  .rtb-participant--winner::before {
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
  .rtb-participant__name {
    font-weight: 600;
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
      { id: "QAT", name: "🇶🇦 QAT", resultText: "1", isWinner: false, status: "PLAYED" },
      { id: "ESP", name: "🇪🇸 ESP", resultText: "2", isWinner: true, status: "PLAYED" },
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
      { id: "GER", name: "🇩🇪 GER", resultText: "0", isWinner: false, status: "PLAYED" },
      { id: "FRA", name: "🇫🇷 FRA", resultText: "1", isWinner: true, status: "PLAYED" },
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
      { id: "BRA", name: "🇧🇷 BRA", resultText: "3", isWinner: true, status: "PLAYED" },
      { id: "ARG", name: "🇦🇷 ARG", resultText: "2", isWinner: false, status: "PLAYED" },
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
      { id: "ENG", name: "🇬🇧 ENG", resultText: "2", isWinner: true, status: "PLAYED" },
      { id: "NED", name: "🇳🇱 NED", resultText: "0", isWinner: false, status: "PLAYED" },
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
      { id: "W1", name: "🇪🇸 ESP", resultText: null, isWinner: false, status: "NO_SHOW" },
      { id: "W2", name: "🇫🇷 FRA", resultText: null, isWinner: false, status: "NO_SHOW" },
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
      { id: "W3", name: "🇧🇷 BRA", resultText: null, isWinner: false, status: "NO_SHOW" },
      { id: "W4", name: "🇬🇧 ENG", resultText: null, isWinner: false, status: "NO_SHOW" },
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 1200, height: 600 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Wrap default Match to decorate winners with a trophy and bold label
  const CustomMatch = useMemo(() => {
    return function WrappedMatch(props: any) {
      const m = props.match;
      const participants = (m?.participants || []).map((p: any) => {
        if (!p) return p;
        const isWinner = p.isWinner === true;
        const decoratedName = isWinner ? `🏆 ${p.name}` : p.name;
        return { ...p, name: decoratedName };
      });
      const decorated = { ...m, participants };
      return <Match {...props} match={decorated} />;
    };
  }, []);

  // Compute ordered round labels from graph depth
  const roundLabels = useMemo(() => {
    const matches = demoMatches as any[];
    const byId = new Map<number, any>();
    matches.forEach(m => byId.set(m.id, m));
    const depthCache = new Map<number, number>();
    const depthOf = (id: number | null): number => {
      if (!id) return 0;
      if (depthCache.has(id)) return depthCache.get(id)!;
      const m = byId.get(id);
      const d = 1 + depthOf(m?.nextMatchId ?? null);
      depthCache.set(id, d);
      return d;
    };
    const rounds = new Map<number, string>();
    matches.forEach(m => {
      const d = depthOf(m.id);
      // larger depth means earlier round; normalize to order left->right
      rounds.set(d, m.tournamentRoundText);
    });
    const sorted = Array.from(rounds.entries()).sort((a,b) => a[0]-b[0]).map(([,name]) => name);
    return sorted;
  }, []);

  return (
    <SCThemeProvider theme={scTheme}>
      <GlobalLines />
      {/* Round headers */}
      <div className="px-4 pb-1">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(3, roundLabels.length)}, minmax(0, 1fr))` }}>
          {roundLabels.map((r) => (
            <div key={r} className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 text-center pb-1">
              {r}
            </div>
          ))}
        </div>
      </div>
      <Container ref={wrapperRef} className="bg-white dark:bg-black">
        {canScrollLeft && <EdgeFade side="left" />}
        {canScrollRight && <EdgeFade side="right" />}
        <div className="min-w-[900px] mx-auto">
          <SVGViewer width={dims.width} height={dims.height} background={"transparent"}>
            <SingleEliminationBracket
              matches={demoMatches as any}
              matchComponent={CustomMatch as any}
            />
          </SVGViewer>
        </div>
      </Container>
    </SCThemeProvider>
  );
}
