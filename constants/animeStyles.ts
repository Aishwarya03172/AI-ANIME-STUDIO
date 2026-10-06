import type { AnimeStyleOption } from '@/types/animeStyle';

export const ANIME_STYLES: AnimeStyleOption[] = [
  {
    id: 'modern-anime',
    label: 'Modern Anime',
    description: 'Clean lines, vibrant color',
    accent: '#a78bfa',
    emoji: '✦',
  },
  {
    id: 'studio-ghibli',
    label: 'Studio Ghibli',
    description: 'Soft skies, painted warmth',
    accent: '#86efac',
    emoji: '❀',
  },
  {
    id: 'manga',
    label: 'Manga',
    description: 'Ink contrast, panel energy',
    accent: '#e5e7eb',
    emoji: '▦',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon nights, chrome glow',
    accent: '#22d3ee',
    emoji: '⚡',
  },
  {
    id: 'chibi',
    label: 'Chibi',
    description: 'Cute proportions, big eyes',
    accent: '#f9a8d4',
    emoji: '♡',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    description: 'Washes, gentle texture',
    accent: '#93c5fd',
    emoji: '◈',
  },
];

export function getAnimeStyleById(id: string | undefined) {
  return ANIME_STYLES.find((style) => style.id === id) ?? null;
}
