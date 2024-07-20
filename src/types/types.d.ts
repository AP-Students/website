// types.d.ts
declare module "editorjs-latex";
declare module "@editorjs/simple-image";
declare module "editorjs-math";
declare module "@editorjs/quote";
declare module "@editorjs/warning";
declare module "@editorjs/delimiter";
declare module "@editorjs/table";
declare module "@editorjs/code";
declare module "@editorjs/marker";
declare module "@editorjs/list";
declare module "@editorjs/nested-list";
declare module "@editorjs/attaches";
declare module "@editorjs/embed";
declare module "@editorjs/inline-code";
declare module "@editorjs/underline";

declare module "editorjs-parser" {
  // Configuration Interfaces
  interface ImageConfig {
    use: "figure" | "img";
    imgClass?: string;
    figureClass?: string;
    figCapClass?: string;
    path?: "absolute";
  }

  interface ParagraphConfig {
    pClass?: string;
  }

  interface CodeConfig {
    codeBlockClass?: string;
  }

  interface EmbedConfig {
    useProvidedLength?: boolean;
  }

  interface QuoteConfig {
    applyAlignment?: boolean;
  }

  interface Config {
    image?: ImageConfig;
    paragraph?: ParagraphConfig;
    code?: CodeConfig;
    embed?: EmbedConfig;
    quote?: QuoteConfig;
  }

  // Block Interfaces
  interface BlockData {
    text?: string;
    level?: number;
    style?: "ordered" | "unordered";
    items?: string[];
    alignment?: string;
    caption?: string;
    file?: {
      url?: string;
      [key: string]: unknown;
    };
    url?: string;
    stretched?: boolean;
    withBorder?: boolean;
    withBackground?: boolean;
    code?: string;
    html?: string;
    embed?: string;
    width?: number;
    height?: number;
    service?: string;
    source?: string;
    [key: string]: unknown;
  }

  interface Block {
    type: string;
    data: BlockData;
  }

  // Utility Functions
  declare function isObject(item: unknown): boolean;

  declare function mergeDeep(target: unknown, source: unknown): unknown;

  declare function sanitizeHtml(markup: string): string;

  declare const embedMarkups: Record<string, string>;

  // Parsers
  declare const defaultParsers: Record<
    string,
    (data: BlockData, config: Config) => string
  >;

  // Main Parser Class
  declare class edjsParser {
    config: Config;
    parsers: Record<string, (data: BlockData, config: Config) => string>;

    constructor(
      config?: Config,
      customs?: Record<string, (data: BlockData, config: Config) => string>,
      embeds?: Record<string, string>,
    );

    parse(EditorJsObject: { blocks: Block[] }): string;

    parseBlock(block: Block): string | Error;
  }

  // Export the main class and utility functions
  export {
    edjsParser as default,
    isObject,
    mergeDeep,
    sanitizeHtml,
    embedMarkups,
    defaultParsers,
    BlockData,
    Block,
    Config,
    ImageConfig,
    ParagraphConfig,
    CodeConfig,
    EmbedConfig,
    QuoteConfig,
  };
}
