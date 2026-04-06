export interface DimensionScore {
  key: string;
  label: string;
  emoji: string;
  score: number;
  weight: number;
  detail: string;
}

export interface AnalysisResult {
  repo: string;
  score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  dimensions: DimensionScore[];
  meta: {
    stars: number;
    forks: number;
    language: string | null;
    description: string | null;
    owner: string;
    avatar: string;
    updatedAt: string;
    analyzedAt: string;
  };
}
