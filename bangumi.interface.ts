export interface Subject {
  id: number;
  type: number;
  name: string;
  name_cn: string;
  summary: string;
  date: string;
  images: {
    large: string;
    common: string;
    medium: string;
    small: string;
    grid: string;
  };
  total_episodes: number;
  tags?: { name: string }[];
}

export interface CalendarItem {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  }
  items: Subject[];
}
