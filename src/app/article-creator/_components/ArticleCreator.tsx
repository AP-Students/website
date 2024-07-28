"use client";

import { useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Renderer from "./Renderer";
import Editor from "./Editor";
import { cn } from "@/lib/utils";

function ArticleCreator({ className }: { className?: string }) {
  const [data, setData] = useState<OutputData>({
    time: Date.now(),
    blocks: [
      {
        id: "vN7jsMIAZd",
        type: "header",
        data: {
          text: "Enter title here...",
          level: 1,
        },
      },
      {
        id: "y5P_E6yFAY",
        type: "header",
        data: {
          text: "Enter a subheader...",
          level: 2,
        },
      },
      {
        id: "R0mt9g_qT4",
        type: "paragraph",
        data: {
          text: "This is some text...",
        },
      },
    ],
    version: "2.30.2",
  });

  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y-2 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0",
        className,
      )}
    >
      <Editor setData={setData} />

      <div className="px-8">
        <div className="mb-4 pb-4 opacity-50 sm:pt-0">Output:</div>

        <div>
          <Renderer content={data} />
        </div>
      </div>
    </div>
  );
}

export default ArticleCreator;
