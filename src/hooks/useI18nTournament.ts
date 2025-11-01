// useI18nTournament.ts
import { useState, useEffect } from 'react';

// Translation dictionaries
const translations = {
  en: {
    tournamentSystem: 'Tournament System',
    groupStage: 'Group Stage',
    knockout: 'Knockout',
    group: 'Group',
    completed: 'Completed',
    live: 'Live',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
    scheduled: 'Scheduled',
    recentMatches: 'Recent Matches',
    matchDetails: 'Match Details',
    venue: 'Venue',
    status: 'Status',
    participants: 'Participants',
    retry: 'Retry',
    loading: 'Loading tournament data...',
    errorLoading: 'Error Loading Tournament',
    noData: 'No knockout stage data available',
    connectionLive: 'Live',
    connectionConnecting: 'Connecting...',
    connectionDisconnected: 'Disconnected',
    // Match statuses
    SCORE_DONE: 'Completed',
    WALK_OVER: 'Walk Over',
    NO_SHOW: 'No Show',
    RUNNING: 'Live',
    SCHEDULED: 'Scheduled',
    POSTPONED: 'Postponed',
    CANCELLED: 'Cancelled',
    // Round names
    round_of_16: 'Round of 16',
    quarter_finals: 'Quarter Finals',
    semi_finals: 'Semi Finals',
    final: 'Final'
  },
  es: {
    tournamentSystem: 'Sistema de Torneo',
    groupStage: 'Fase de Grupos',
    knockout: 'Eliminatoria',
    group: 'Grupo',
    completed: 'Completado',
    live: 'En Vivo',
    postponed: 'Aplazado',
    cancelled: 'Cancelado',
    scheduled: 'Programado',
    recentMatches: 'Partidos Recientes',
    matchDetails: 'Detalles del Partido',
    venue: 'Lugar',
    status: 'Estado',
    participants: 'Participantes',
    retry: 'Reintentar',
    loading: 'Cargando datos del torneo...',
    errorLoading: 'Error al Cargar el Torneo',
    noData: 'No hay datos disponibles de la fase eliminatoria',
    connectionLive: 'En Vivo',
    connectionConnecting: 'Conectando...',
    connectionDisconnected: 'Desconectado',
    // Match statuses
    SCORE_DONE: 'Completado',
    WALK_OVER: 'Por Inasistencia',
    NO_SHOW: 'No Presentado',
    RUNNING: 'En Vivo',
    SCHEDULED: 'Programado',
    POSTPONED: 'Aplazado',
    CANCELLED: 'Cancelado',
    // Round names
    round_of_16: 'Octavos de Final',
    quarter_finals: 'Cuartos de Final',
    semi_finals: 'Semifinales',
    final: 'Final'
  },
  fr: {
    tournamentSystem: 'Système de Tournoi',
    groupStage: 'Phase de Groupes',
    knockout: 'Éliminatoire',
    group: 'Groupe',
    completed: 'Terminé',
    live: 'En Direct',
    postponed: 'Reporté',
    cancelled: 'Annulé',
    scheduled: 'Prévu',
    recentMatches: 'Matchs Récents',
    matchDetails: 'Détails du Match',
    venue: 'Lieu',
    status: 'Statut',
    participants: 'Participants',
    retry: 'Réessayer',
    loading: 'Chargement des données du tournoi...',
    errorLoading: 'Erreur de Chargement du Tournoi',
    noData: 'Aucune donnée disponible pour la phase éliminatoire',
    connectionLive: 'En Direct',
    connectionConnecting: 'Connexion...',
    connectionDisconnected: 'Déconnecté',
    // Match statuses
    SCORE_DONE: 'Terminé',
    WALK_OVER: 'Forfait',
    NO_SHOW: 'Absent',
    RUNNING: 'En Direct',
    SCHEDULED: 'Prévu',
    POSTPONED: 'Reporté',
    CANCELLED: 'Annulé',
    // Round names
    round_of_16: 'Huitièmes de Finale',
    quarter_finals: 'Quarts de Finale',
    semi_finals: 'Demi-Finales',
    final: 'Finale'
  }
};

type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; // Export the type

export const useI18nTournament = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [translationsDict, setTranslationsDict] = useState(translations.en);

  // Initialize language from browser settings or localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('tournamentLanguage') as Language;
    const browserLanguage = navigator.language.split('-')[0] as Language;
    
    let initialLanguage: Language = 'en';
    
    if (savedLanguage && translations[savedLanguage]) {
      initialLanguage = savedLanguage;
    } else if (translations[browserLanguage]) {
      initialLanguage = browserLanguage;
    }
    
    setLanguage(initialLanguage);
    setTranslationsDict(translations[initialLanguage]);
  }, []);

  // Change language
  const changeLanguage = (newLanguage: Language) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      setTranslationsDict(translations[newLanguage]);
      localStorage.setItem('tournamentLanguage', newLanguage);
    }
  };

  // Get translated string
  const t = (key: TranslationKey): string => {
    return translationsDict[key] || key;
  };

  // Format round name
  const formatRoundName = (round: string): string => {
    const key = round as TranslationKey;
    return translationsDict[key] || round.replace('_', ' ');
  };

  // Format match status
  const formatMatchStatus = (status: string): string => {
    const key = status as TranslationKey;
    return translationsDict[key] || status.replace('_', ' ');
  };

  return {
    language,
    changeLanguage,
    t,
    formatRoundName,
    formatMatchStatus
  };
};

export default useI18nTournament;