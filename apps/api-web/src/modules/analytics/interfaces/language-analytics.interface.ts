export interface LanguageAggregate {
  language: string;
  label: string;
  count: number;
}

export interface LanguageTimelinePoint {
  date: string;
  count: number;
}

export interface LanguageTimelineSeries {
  language: string;
  label: string;
  points: LanguageTimelinePoint[];
}
