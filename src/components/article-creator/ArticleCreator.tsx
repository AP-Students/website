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
import { revertTableObjectToArray, getKey, processImage, processTable, processQuestions } from "./FetchArticleFunctions";
import { Blocker } from "@/app/admin/subject/navigation-block";
import { Button } from "@/components/ui/button";

function ArticleCreator({ className }: { className?: string }) {
  // Needs 2 seperate data states, otherwise there will be constant rendering in the editor => impossible to edit
  const [initialData, setInitialData] = useState<OutputData>({
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

  useEffect(() => {
    (async () => {
      const userAccess = await getUserAccess();
      if (userAccess && (userAccess === "admin" || userAccess === "member")) {
        const key = getKey();

        const docRef = doc(db, "pages", key);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data()?.data as OutputData;

        revertTableObjectToArray(data);
        setInitialData(data);
        setData(data);
      }
    })().catch((error) => {
      console.error("Error fetching data:", error);
    });
  }, []);

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
      creator: user,
      title: pathParts.join("/"),
      data,
    };

    try {
      const docRef = doc(db, "pages", pathParts.join("-"));

      const updatedDataBlocks = await Promise.all(
        data.blocks.map(async (block) => {
          // Check if the block is of type 'questionsAddCard'
          if (block.type === "questionsAddCard") {
            const updatedQuestions = await processQuestions(
              block.data.questions as QuestionFormat[],
            );
            block.data.questions = updatedQuestions;
            return block;
          }

          if (block.type === "table") {
            const updatedTable = await processTable(block.data);
            block.data.content = updatedTable;
            return block;
          }

          // because of .type, its inferable that block.data is of an image, but idk where the type is defined.
          /* eslint-disable-next-line */
          if (block.type === "image" && block.data.url.startsWith("data:image/")) {
            const updatedImage = await processImage(block.data);
            block.data = updatedImage; // Replace the block data with the updated content
            return block;
          }

          return block; // If not a questions block, return original block
        }),
      );

      /* eslint-enable */

      newArticle.data.blocks = updatedDataBlocks;
      await setDoc(docRef, newArticle);

      alert(`Article saved: ${docRef.id}`);
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Error saving article.");
    }
  };

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="flex justify-end">
        <Button
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => handleSave()}
        >
          <Save className="mr-2" /> Save Changes
        </Button>
      </div>

      <div className={cn("grid grid-cols-1 pb-8 sm:grid-cols-2", className)}>
        {/* Left column: Editor */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto rounded border border-gray-300 p-4 px-8">
          <Editor
            content={initialData}
            setData={setData}
            setUnsavedChanges={setUnsavedChanges}
          />
        </div>

        {/* Right column: Renderer */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto px-8">
          <div className="my-4 pb-4 opacity-50">Output:</div>
          <Renderer content={data} />
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
