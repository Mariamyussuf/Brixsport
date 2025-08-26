"use client";
import React from "react";

export interface GroupTeamRow {
  pos: number;
  club: string;
  played: number; // PL
  win: number; // W
  draw: number; // D
  loss: number; // L
  gd: number; // GD
  pts: number; // PTS
}

export interface GroupData {
  name: string; // e.g., "GROUP 1"
  teams: GroupTeamRow[];
}

const HeaderCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={`text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-2.5 ${className ?? ""}`}>{children}</th>
);

const Cell: React.FC<{ children: React.ReactNode; right?: boolean }>= ({ children, right }) => (
  <td className={`py-3 text-sm md:text-[15px] ${right ? "text-right tabular-nums" : "text-left"} text-slate-700 dark:text-slate-200`}>{children}</td>
);

export const GroupStageTable: React.FC<{ groups: GroupData[] }>= ({ groups }) => {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.name} className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-center text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300 py-3 bg-sky-50/70 dark:bg-white/5">
            {g.name}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-sky-50/80 dark:bg-white/10">
                <tr>
                  <HeaderCell className="pl-4 pr-2 w-12 sticky left-0 bg-sky-50/80 dark:bg-white/10">#</HeaderCell>
                  <HeaderCell className="text-left sticky left-12 bg-sky-50/80 dark:bg-white/10">CLUBS</HeaderCell>
                  <HeaderCell className="text-right">PL</HeaderCell>
                  <HeaderCell className="text-right">W</HeaderCell>
                  <HeaderCell className="text-right">D</HeaderCell>
                  <HeaderCell className="text-right">L</HeaderCell>
                  <HeaderCell className="text-right">GD</HeaderCell>
                  <HeaderCell className="text-right pr-4">PTS</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {g.teams.map((t) => (
                  <tr key={t.pos} className="border-t border-gray-100 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 text-left text-slate-500 dark:text-slate-300 pl-4 pr-2 w-12 sticky left-0 bg-white dark:bg-slate-900 tabular-nums">{t.pos}.</td>
                    <td className="py-3 text-left text-slate-700 dark:text-slate-200 sticky left-12 bg-white dark:bg-slate-900">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-500"></span>
                        <span className="font-medium">{t.club}</span>
                      </span>
                    </td>
                    <Cell right>{t.played}</Cell>
                    <Cell right>{t.win}</Cell>
                    <Cell right>{t.draw}</Cell>
                    <Cell right>{t.loss}</Cell>
                    <Cell right>{t.gd}</Cell>
                    <Cell right>
                      <span className="pr-4 inline-flex justify-end">
                        <span className="inline-flex min-w-[2.25rem] justify-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-semibold tabular-nums">
                          {t.pts}
                        </span>
                      </span>
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupStageTable;
