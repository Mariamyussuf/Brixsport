export interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
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