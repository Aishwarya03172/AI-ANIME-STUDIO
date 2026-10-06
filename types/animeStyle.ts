export type AnimeStyleId =
  | 'modern-anime'
  | 'studio-ghibli'
  | 'manga'
  | 'cyberpunk'
  | 'chibi'
  | 'watercolor';

export type AnimeStyleOption = {
  id: AnimeStyleId;
  label: string;
  description: string;
  accent: string;
  emoji: string;
};
