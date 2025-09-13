export interface Competition {
  id: string;
  name: string;
  type: string;
  country: string;
  season: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  team_id: string;
}

export interface Team {
  id: string;
  name:string;
  logo_url: string;
  founded_year: number;
  stadium: string;
  city: string;
}
