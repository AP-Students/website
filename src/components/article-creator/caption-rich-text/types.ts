/** A formatting mark that can be applied to a range of caption text. */
export type CaptionMark = 
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "highlight" }
  | { type: "link"; href: string };

/** A link formatting mark (a CaptionMark variant extractor type). */
export type CaptionLinkMark = Extract<CaptionMark, { type: "link" }>;

/** A segment of caption text with optional formatting marks. */
export interface CaptionSegment {
  text: string;
  marks: CaptionMark[];
}

/** The structured rich-text representation of a caption. */
export type RichCaption = CaptionSegment[];