"use client";
import React from "react";
import { useSettings } from "./SettingsContext";

export type Messages = Record<string, string>;

const DICTS: Record<string, Messages> = {
  en: {
    no_items_found: "No items found",
    try_adjust_filter: "Try adjusting your filter",
    app_title: "BrixSports",
    live: "Live",
    upcoming: "Upcoming",
    vs: "vs",
    track_events: "Track events",
    competitions: "Competitions",
    football_section: "BUSA league - Football",
    basketball_section: "BUSA league - Basketball",
    no_live_matches: "No live matches at the moment",
    check_back_later: "Check back later or view fixtures for upcoming matches",
    view_all_track_events: "View all track events →",
    current_competition_fixtures: "Current competition fixtures",
    all: "All",
    football: "Football",
    basketball: "Basketball",
    ended: "Ended",
    team: "Team",
    player: "Player",
    match: "Match",
    competition: "Competition",
    search_placeholder: "Search players, teams, competitions...",
    items: "items",
    filtered_by: "filtered by",
    active_competition: "Active competition",
    all_competitions: "All competitions",
    fixtures: "Fixtures",
    results: "Results",
    stats: "Stats",
    standings: "Standings",
    group_stage: "Group stage",
    knockout_stage: "Knockout stage",
    coming_soon: "Content coming soon.",
    your_teams: "YOUR TEAMS",
    your_players: "YOUR PLAYERS",
    your_competitions: "YOUR COMPETITIONS",
    add_favourite_team: "Add favourite team",
    add_favourite_player: "Add favourite player",
    add_favourite_competition: "Add favourite competition",
  },
  fr: {
    no_items_found: "Aucun élément trouvé",
    try_adjust_filter: "Essayez de modifier votre filtre",
    app_title: "BrixSports",
    live: "En direct",
    upcoming: "À venir",
    vs: "vs",
    track_events: "Épreuves d'athlétisme",
    competitions: "Compétitions",
    football_section: "Ligue BUSA - Football",
    basketball_section: "Ligue BUSA - Basket-ball",
    no_live_matches: "Aucun match en direct pour le moment",
    check_back_later: "Revenez plus tard ou consultez les prochaines rencontres",
    view_all_track_events: "Voir toutes les épreuves →",
    current_competition_fixtures: "Calendrier de la compétition en cours",
    all: "Tous",
    football: "Football",
    basketball: "Basket-ball",
    ended: "Terminé",
    team: "Équipe",
    player: "Joueur",
    match: "Match",
    competition: "Compétition",
    search_placeholder: "Rechercher des joueurs, équipes, compétitions...",
    items: "éléments",
    filtered_by: "filtré par",
    active_competition: "Compétition active",
    all_competitions: "Toutes les compétitions",
    fixtures: "Calendrier",
    results: "Résultats",
    stats: "Statistiques",
    standings: "Classement",
    group_stage: "Phase de groupes",
    knockout_stage: "Phase finale",
    coming_soon: "Contenu à venir.",
    your_teams: "VOS ÉQUIPES",
    your_players: "VOS JOUEURS",
    your_competitions: "VOS COMPÉTITIONS",
    add_favourite_team: "Ajouter une équipe favorite",
    add_favourite_player: "Ajouter un joueur favori",
    add_favourite_competition: "Ajouter une compétition favorite",
  },
  es: {
    no_items_found: "No se encontraron elementos",
    try_adjust_filter: "Intenta ajustar tu filtro",
    app_title: "BrixSports",
    live: "En vivo",
    upcoming: "Próximos",
    vs: "vs",
    track_events: "Atletismo",
    competitions: "Competiciones",
    football_section: "Liga BUSA - Fútbol",
    basketball_section: "Liga BUSA - Baloncesto",
    no_live_matches: "No hay partidos en vivo por el momento",
    check_back_later: "Vuelve más tarde o revisa los próximos partidos",
    view_all_track_events: "Ver todas las pruebas →",
    current_competition_fixtures: "Calendario de la competición actual",
    all: "Todos",
    football: "Fútbol",
    basketball: "Baloncesto",
    ended: "Finalizado",
    team: "Equipo",
    player: "Jugador",
    match: "Partido",
    competition: "Competición",
    search_placeholder: "Buscar jugadores, equipos, competiciones...",
    items: "elementos",
    filtered_by: "filtrado por",
    active_competition: "Competición activa",
    all_competitions: "Todas las competiciones",
    fixtures: "Calendario",
    results: "Resultados",
    stats: "Estadísticas",
    standings: "Clasificación",
    group_stage: "Fase de grupos",
    knockout_stage: "Eliminatorias",
    coming_soon: "Contenido próximamente.",
    your_teams: "TUS EQUIPOS",
    your_players: "TUS JUGADORES",
    your_competitions: "TUS COMPETICIONES",
    add_favourite_team: "Añadir equipo favorito",
    add_favourite_player: "Añadir jugador favorito",
    add_favourite_competition: "Añadir competición favorita",
  },
};

interface I18nCtx {
  t: (key: string) => string;
}

const I18nContext = React.createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useSettings();
  const dict = DICTS[language] ?? DICTS.en;
  const t = React.useCallback((key: string) => dict[key] ?? key, [dict]);
  const value = React.useMemo(() => ({ t }), [t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
