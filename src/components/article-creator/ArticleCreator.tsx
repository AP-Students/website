"use client";
import React, { useEffect, useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Editor from "./Editor";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getUser, getUserAccess } from "@/components/hooks/users";
import { Save } from "lucide-react";
import { type QuestionFormat } from "@/types/questions";
import Renderer from "./Renderer";
import {
  processQuestions,
  processTable,
  revertTableObjectToArray,
} from "./FetchArticleFunctions";
import { Blocker } from "@/app/admin/subject/navigation-block";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Handles undefined properties in ordered lists' meta data
// undefined start property occurs when nested item is created
// undefined counterType property occurs when switching between ordered and unordered lists
function cleanUndefined(obj: unknown) {
  if (Array.isArray(obj)) {
    obj.forEach(cleanUndefined);
  } else if (obj && typeof obj === "object") {
    if ("meta" in obj && obj.meta && typeof obj.meta === "object") {
      const meta = obj.meta as { start?: number; counterType?: string };
      if (meta.start === undefined) {
        delete meta.start;
      }
      if (meta.counterType === undefined) {
        delete meta.counterType;
      }
    }

    // Recursively clean all nested properties
    Object.values(obj).forEach(cleanUndefined);
  }
}

interface ArticleData {
  id: string;
  createdAt: { seconds: number; nanoseconds: number };
  author: string;
  title: string;
  data: OutputData;
}

function ArticleCreator({ className }: { className?: string }) {
  // Needs 2 seperate data states, otherwise there will be constant rendering in the editor => impossible to edit
  const [initialData, setInitialData] = useState<OutputData>({
    time: Date.now(),
    blocks: [
      {
        id: "vN7jsMIAZd",
        type: "header",
        data: { text: "Enter title here...", level: 1 },
      },
      {
        id: "y5P_E6yFAY",
        type: "header",
        data: { text: "Enter a subheader...", level: 2 },
      },
      {
        id: "R0mt9g_qT4",
        type: "paragraph",
        data: { text: "This is some text..." },
      },
    ],
    version: "2.30.2",
  });

  const [data, setData] = useState<OutputData>({
    time: Date.now(),
    blocks: [
      {
        id: "vN7jsMIAZd",
        type: "header",
        data: { text: "Enter title here...", level: 1 },
      },
      {
        id: "y5P_E6yFAY",
        type: "header",
        data: { text: "Enter a subheader...", level: 2 },
      },
      {
        id: "R0mt9g_qT4",
        type: "paragraph",
        data: { text: "This is some text..." },
      },
    ],
    version: "2.30.2",
  });

  const pathname = usePathname();
  const pathParts = pathname.split("/").slice(-4);
  const subject = pathParts[0]!;
  const unit = pathParts[1]!;
  const chapter = pathParts[3]!;

  const [chapterLoading, setChapterLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const userAccess = await getUserAccess();
      if (userAccess && (userAccess === "admin" || userAccess === "member")) {
        const docRef = doc(
          db,
          "subjects",
          subject,
          "units",
          unit,
          "chapters",
          chapter,
        );
        const docSnap = await getDoc(docRef);
        const articleData = docSnap.data() as ArticleData;
        const editorData = articleData.data;
        setAuthor(articleData.author ?? "");

        revertTableObjectToArray(editorData);
        setInitialData(editorData);
        setData(editorData);
        setChapterLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching data:", error);
    });
  }, [chapter, subject, unit]);

  const handleSave = async () => {
    if (!data) {
      alert("Please enter the content.");
      return;
    }

    const user = await getUser();
    const pathParts = window.location.pathname.split("/").slice(-3);

    if (!user || (user.access !== "admin" && user.access !== "member")) {
      alert("User is not authorized to perform this action.");
      return;
    }

    const newArticle = {
      id: uuidv4(),
      createdAt: new Date(),
      author,
      title: pathParts.join("/"),
      data,
    };

    try {
      const docRef = doc(
        db,
        "subjects",
        subject,
        "units",
        unit,
        "chapters",
        chapter,
      );

      // Traverse through data to find QuestionFormat[] arrays
      const updatedDataBlocks = await Promise.all(
        data.blocks.map(async (block) => {
          // because of .type, its inferable that block.data is of an questions, so you can assert .data.questions as QuestionFormat[]
          /* eslint-disable */
          if (block.type === "questionsAddCard") {
            const updatedQuestions = await processQuestions(
              block.data.questions as QuestionFormat[],
            );

            return {
              ...block,
              data: {
                ...block.data,
                questions: updatedQuestions,
              },
            };
          }

          if (block.type === "table") {
            const updatedTable = await processTable(block.data);
            return {
              ...block,
              data: {
                ...block.data,
                content: updatedTable,
              },
            };
          }

          if (block.type === "list") {
            // console.dir("before", block.data.meta);
            // cleanUndefined(block);
            // console.dir("after", block.data.meta);

            const meta = { ...block.data.meta };

            if (meta.start === undefined) {
              delete meta.start;
            }

            if (meta.counterType === undefined) {
              meta.counterType = "numeric";
            }

            return {
              ...block,
              data: {
                ...block.data,
                meta,
              },
            };
            // return JSON.parse(JSON.stringify(block)) as OutputBlockData;
          }

          return { ...block }; // If not a questions block, return original block
        }),
      );

      /* eslint-enable */

      const updatedArticle = {
        ...newArticle,
        data: {
          ...data,
          blocks: updatedDataBlocks,
        },
      };

      await setDoc(docRef, updatedArticle);

      setData(updatedArticle.data); // re-render

      alert(`Article saved successfully.`);
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving article:", error);
      alert("ERROR SAVING ARTICLE!\n" + String(error));
    }
  };

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  const [author, setAuthor] = useState<string>("");

  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="flex items-end justify-between gap-2">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="author">Author</Label>
          <Input
            type="text"
            id="author"
            placeholder="Lance"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        {(!chapterLoading || unsavedChanges) && (
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => handleSave()}
          >
            <Save className="mr-2" /> Save Changes
          </Button>
        )}
      </div>

      <div className={cn("grid grid-cols-1 pb-8 sm:grid-cols-2", className)}>
        {/* Left column: Editor */}
        <div className="rounded-md border p-4">
          <Editor
            content={initialData}
            setData={setData}
            setUnsavedChanges={setUnsavedChanges}
          />
        </div>

        {/* Right column: Renderer */}
        <div className="px-8 break-words overflow-hidden">
          <div className="pb-8 pt-4 opacity-50">Preview:</div>
          <Renderer content={data} />
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
