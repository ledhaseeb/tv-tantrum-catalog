// Direct database interface using existing table structure
export interface TvShow {
  id: number;
  name: string;
  description: string;
  age_range: string;
  episode_length: number;
  creator?: string;
  release_year?: number;
  end_year?: number;
  is_ongoing?: boolean;
  seasons?: number;
  stimulation_score: number;
  interactivity_level?: string;
  dialogue_intensity?: string;
  sound_effects_level?: string;
  music_tempo?: string;
  total_music_level?: string;
  total_sound_effect_time_level?: string;
  scene_frequency?: string;
  creativity_rating?: number;
  animation_style?: string;
  image_url?: string;
  is_featured?: boolean;
  subscriber_count?: string;
  video_count?: string;
  channel_id?: string;
  is_youtube_channel?: boolean;
  published_at?: string;
  available_on?: string[];
  themes?: string[];
}

export interface ResearchSummary {
  id: number;
  title: string;
  summary?: string;
  full_text?: string;
  category: string;
  image_url?: string;
  source?: string;
  original_url?: string;
  published_date?: string;
  headline?: string;
  sub_headline?: string;
  key_findings?: string;
  created_at?: string;
  updated_at?: string;
}

// Normalized interface for frontend
export interface Show {
  id: number;
  name: string;
  description: string;
  ageRange: string;
  episodeLength: number;
  creator?: string;
  releaseYear?: number;
  endYear?: number;
  isOngoing?: boolean;
  seasons?: number;
  stimulationScore: number;
  interactivityLevel?: string;
  dialogueIntensity?: string;
  soundEffectsLevel?: string;
  musicTempo?: string;
  totalMusicLevel?: string;
  totalSoundEffectTimeLevel?: string;
  sceneFrequency?: string;
  creativityRating?: number;
  animationStyle?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  subscriberCount?: string;
  videoCount?: string;
  channelId?: string;
  isYouTubeChannel?: boolean;
  publishedAt?: string;
  availableOn?: string[];
  themes?: string[];
}

// Convert database row to frontend interface
export function normalizeShow(dbShow: TvShow): Show {
  return {
    id: dbShow.id,
    name: dbShow.name,
    description: dbShow.description,
    ageRange: dbShow.age_range,
    episodeLength: dbShow.episode_length,
    creator: dbShow.creator,
    releaseYear: dbShow.release_year,
    endYear: dbShow.end_year,
    isOngoing: dbShow.is_ongoing,
    seasons: dbShow.seasons,
    stimulationScore: dbShow.stimulation_score,
    interactivityLevel: dbShow.interactivity_level,
    dialogueIntensity: dbShow.dialogue_intensity,
    soundEffectsLevel: dbShow.sound_effects_level,
    musicTempo: dbShow.music_tempo,
    totalMusicLevel: dbShow.total_music_level,
    totalSoundEffectTimeLevel: dbShow.total_sound_effect_time_level,
    sceneFrequency: dbShow.scene_frequency,
    creativityRating: dbShow.creativity_rating,
    animationStyle: dbShow.animation_style,
    imageUrl: dbShow.image_url,
    isFeatured: dbShow.is_featured,
    subscriberCount: dbShow.subscriber_count,
    videoCount: dbShow.video_count,
    channelId: dbShow.channel_id,
    isYouTubeChannel: dbShow.is_youtube_channel,
    publishedAt: dbShow.published_at,
    availableOn: dbShow.available_on,
    themes: dbShow.themes,
  };
}