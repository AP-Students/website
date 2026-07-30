import type { API, BlockAPI, BlockTune } from "@editorjs/editorjs";
import { ALIGNMENT_VALUES, type AlignmentValue, sanitizeAlignment } from "./alignment";

const ICONS: Record<AlignmentValue, string> = {
  left: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12H3"/><path d="M17 18H3"/><path d="M21 6H3"/></svg>`,
  center: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12H7"/><path d="M19 18H5"/><path d="M21 6H3"/></svg>`,
  right: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H9"/><path d="M21 18H7"/><path d="M21 6H3"/></svg>`,
  justify: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M3 18h18"/><path d="M3 6h18"/></svg>`,
};

const TITLES: Record<AlignmentValue, string> = {
  left: "Align left",
  center: "Align center",
  right: "Align right",
  justify: "Justify",
};

type AlignmentMenuItem = {
  icon: string;
  title: string;
  isActive: boolean;
  closeOnActivate: true;
  onActivate: () => void;
};

export default class AlignmentTune implements BlockTune {
  static isTune = true;

  private readonly block: BlockAPI;
  private alignment: AlignmentValue;

  constructor({ block, data }: { api: API; block: BlockAPI; data: unknown }) {
    this.block = block;
    this.alignment = sanitizeAlignment(data) ?? "left";
  }

  render(): AlignmentMenuItem[] {
    return ALIGNMENT_VALUES.map((value) => ({
      icon: ICONS[value],
      title: TITLES[value],
      isActive: this.alignment === value,
      closeOnActivate: true,
      onActivate: () => {
        this.alignment = value;
        this.block.dispatchChange();
      },
    }));
  }

  save(): AlignmentValue {
    return this.alignment;
  }
}
