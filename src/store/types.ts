export type Run = {
  run_id: string;
  parent_run_id: string | null;
  prompt: string;
  repo_context: string;
  viewport: string;
  mode: string;
  url: string | null;
  html: string | null;
  summary: string | null;
  created_at: number;
};

export type StyleDirectionQuality = "amazing" | "slop";

export type StyleDirection = {
  id: string;
  source_run_id: string | null;
  quality: StyleDirectionQuality;
  aesthetic: string;
  title: string;
  signals: string;
  guidance: string;
  weight: number;
  created_at: number;
};
