export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type BiasLabel = 'left' | 'center' | 'right' | 'mixed' | 'unclear';
export type LogLevel = 'info' | 'warn' | 'error';

export type Source = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
};

export type SourceInsert = {
  id?: string;
  name: string;
  listing_url: string;
  parser_strategy?: string | null;
  is_active?: boolean;
  logo_url?: string | null;
  created_at?: string;
};

export type Article = {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
  created_at: string;
};

export type ArticleInsert = {
  id?: string;
  source_id: string;
  original_url: string;
  canonical_url?: string | null;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at?: string;
  analyzed_at?: string | null;
  created_at?: string;
};

export type ArticleAnalysis = {
  id: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  bias_score: number;
  bias_label: BiasLabel;
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes: string | null;
  loaded_terms: string[] | null;
  disclaimer: string | null;
  model: string;
  embedding?: number[] | null;
  created_at: string;
};

export type ArticleAnalysisInsert = {
  id?: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  bias_score: number;
  bias_label: BiasLabel;
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes?: string | null;
  loaded_terms?: string[] | null;
  disclaimer?: string | null;
  model: string;
  embedding?: number[] | null;
  created_at?: string;
};

export type Log = {
  id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type LogInsert = {
  id?: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

export type OxylabsSchedule = {
  id: string;
  source_id: string | null;
  schedule_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OxylabsScheduleInsert = {
  id?: string;
  source_id?: string | null;
  schedule_id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type OxylabsScheduleRun = {
  id: string;
  schedule_id: string;
  run_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type OxylabsScheduleRunInsert = {
  id?: string;
  schedule_id: string;
  run_id?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
};

export type ArticleWithAnalysis = Article & {
  source?: Source;
  article_analyses?: ArticleAnalysis | ArticleAnalysis[];
  analysis?: ArticleAnalysis;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sources: {
        Row: Source;
        Insert: SourceInsert;
        Update: Partial<SourceInsert>;
        Relationships: [];
      };
      articles: {
        Row: Article;
        Insert: ArticleInsert;
        Update: Partial<ArticleInsert>;
        Relationships: [];
      };
      article_analyses: {
        Row: ArticleAnalysis;
        Insert: ArticleAnalysisInsert;
        Update: Partial<ArticleAnalysisInsert>;
        Relationships: [];
      };
      logs: {
        Row: Log;
        Insert: LogInsert;
        Update: Partial<LogInsert>;
        Relationships: [];
      };
      oxylabs_schedules: {
        Row: OxylabsSchedule;
        Insert: OxylabsScheduleInsert;
        Update: Partial<OxylabsScheduleInsert>;
        Relationships: [];
      };
      oxylabs_schedule_runs: {
        Row: OxylabsScheduleRun;
        Insert: OxylabsScheduleRunInsert;
        Update: Partial<OxylabsScheduleRunInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_related_articles: {
        Args: {
          target_article_id: string;
          target_embedding: string | number[];
          match_count?: number;
        };
        Returns: {
          article_id: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
