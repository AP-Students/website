export type Chapter = {
  chapter: number;
  title: string;
  src: string;
};

export type Unit = {
  unit: number;
  title: string;
  chapters: Chapter[];
};

export type Subject = {
  title: string;
  units: Unit[];
};
