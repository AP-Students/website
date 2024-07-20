"use client";

import { useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Renderer from "./Renderer";
import Editor from "./Editor";

function ArticleCreator() {
  const [data, setData] = useState<OutputData | null>(null);

  return (
    <>
      <div className="ml-36 mt-4 grid grid-cols-2 divide-x-2">
        <Editor setData={setData} />

        <div className="px-8">
          <div className="mb-4 pb-4 opacity-50">Output:</div>

          <div>
            <Renderer content={data!} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
