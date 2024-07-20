"use client";

import { useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Renderer from "./Renderer";
import Editor from "./Editor";

function ArticleCreator() {
  const [data, setData] = useState<OutputData | null>(null);

  return (
    <>
      <div className="mt-4 grid grid-cols-1 divide-y-2 px-12 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0">
        <Editor setData={setData} />

        <div className="px-8">
          <div className="mb-4 pb-4 pt-4 opacity-50 sm:pt-0">Output:</div>

          <div>
            <Renderer content={data!} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
