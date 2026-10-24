export interface AnalysisLabelDefinition {
  label: string;
  meaning: string;
  minScore?: number;
  maxScore?: number;
}

/**
 * Neutral default labels in accordance with legal and compliance guidelines.
 * Words like "buyable", "holdable", and "bad" constitute investment advice or recommendations.
 * Change only after formal legal/compliance review.
 */
export const ANALYSIS_LABELS = {
  STRONG: {
    label: 'Strong financials',
    meaning: 'Metrics are mostly healthy vs the thresholds',
    minScore: 65,
    maxScore: 100
  },
  MIXED: {
    label: 'Mixed financials',
    meaning: 'Some strengths, some weaknesses',
    minScore: 40,
    maxScore: 64
  },
  WEAK: {
    label: 'Weak financials',
    meaning: 'Several metrics are poor vs the thresholds',
    minScore: 0,
    maxScore: 39
  },
  INSUFFICIENT: {
    label: 'Not enough data',
    meaning: 'No verdict shown'
  }
} as const;

export function getLabelForScore(score: number | null, completeness: number): { label: string; meaning: string } {
  if (completeness < 70 || score === null || isNaN(score)) {
    return {
      label: ANALYSIS_LABELS.INSUFFICIENT.label,
      meaning: ANALYSIS_LABELS.INSUFFICIENT.meaning
    };
  }

  if (score >= 65) {
    return {
      label: ANALYSIS_LABELS.STRONG.label,
      meaning: ANALYSIS_LABELS.STRONG.meaning
    };
  }

  if (score >= 40) {
    return {
      label: ANALYSIS_LABELS.MIXED.label,
      meaning: ANALYSIS_LABELS.MIXED.meaning
    };
  }

  return {
    label: ANALYSIS_LABELS.WEAK.label,
    meaning: ANALYSIS_LABELS.WEAK.meaning
  };
}
