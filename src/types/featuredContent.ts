export interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  priority: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  ab_test_variant: string | null;
  view_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFeaturedContentInput {
  title: string;
  description: string;
  image_url?: string;
  link: string;
  priority?: number;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  ab_test_variant?: string | null;
}

export interface UpdateFeaturedContentInput {
  title?: string;
  description?: string;
  image_url?: string;
  link?: string;
  priority?: number;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  ab_test_variant?: string | null;
  view_count?: number;
  click_count?: number;
}