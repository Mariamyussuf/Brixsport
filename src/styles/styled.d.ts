import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    palette: {
      background: string;
      surface: string;
      textPrimary: string;
      textSecondary: string;
      line: string;
      accent: string;
      winner: string;
    };
    borderRadius: number;
    match: {
      backgroundHover: string;
      boxShadow: string;
    };
  }
}
