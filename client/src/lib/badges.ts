export interface Badge {
  name: string;
  emoji: string;
  points: number;
  description: string;
}

export const BADGES: Badge[] = [
  { name: "Tablet Baby", emoji: "👶", points: 25, description: "Welcome to TV Tantrum!" },
  { name: "Toddler Watcher", emoji: "🧒", points: 50, description: "Getting the hang of it" },
  { name: "Show Explorer", emoji: "🔍", points: 100, description: "Discovering new content" },
  { name: "Content Critic", emoji: "📝", points: 150, description: "Sharing your thoughts" },
  { name: "TV Enthusiast", emoji: "📺", points: 250, description: "Really getting into it" },
  { name: "Screen Scholar", emoji: "📚", points: 400, description: "Becoming an expert" },
  { name: "Media Maven", emoji: "🎬", points: 600, description: "True connoisseur" },
  { name: "TV Tamer", emoji: "🧑‍🧒", points: 800, description: "Master of family viewing" },
  { name: "Binge Boss", emoji: "👑", points: 1000, description: "Ruling the remote" },
  { name: "Show Shaman", emoji: "🧙", points: 1200, description: "Mystical viewing powers" },
  { name: "Content Curator", emoji: "🎨", points: 1400, description: "Artistic taste" },
  { name: "Streaming Sage", emoji: "🧠", points: 1600, description: "Wisdom of the streams" },
  { name: "Screen Sensei", emoji: "🧘", points: 2000, description: "Ultimate TV master" }
];

export function getCurrentBadge(points: number): Badge {
  // Find the highest badge the user has earned
  const earnedBadges = BADGES.filter(badge => points >= badge.points);
  return earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : BADGES[0];
}

export function getNextBadge(points: number): Badge | null {
  // Find the next badge to unlock
  const nextBadge = BADGES.find(badge => points < badge.points);
  return nextBadge || null;
}

export function getBadgeName(points: number): string {
  const badge = getCurrentBadge(points);
  return badge.name;
}

export function getBadgeEmoji(points: number): string {
  const badge = getCurrentBadge(points);
  return badge.emoji;
}