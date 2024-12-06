"use client";
import React, { useEffect, useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Editor from "./Editor";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getUser, getUserAccess } from "@/components/hooks/users";
import { Save } from "lucide-react";
import { getFileFromIndexedDB } from "./custom_questions/RenderAdvancedTextbox";
import { type QuestionFormat } from "@/types/questions";
import Renderer from "./Renderer";
import { revertTableObjectToArray, getKey } from "./FetchArticleFunctions";
import { Blocker } from "@/app/admin/subject/_components/navigation-block";
import { Button } from "@/components/ui/button";

function ArticleCreator({ className }: { className?: string }) {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
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

  const openSaveModal = async () => {
    if (!data) {
      alert("Please enter the content.");
      return;
    }

    setShowDropdown(true); // Show the dropdown to select the title
  };

  const handleSave = async () => {
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

      // Function to process questions and upload files
      const processQuestions = async (
        questions: QuestionFormat[],
      ): Promise<QuestionFormat[]> => {
        // Collect all unique fileKeys from questions

        const allFileKeys = new Set<string>();

        questions.forEach((question) => {
          if (question.question?.fileKey) {
            allFileKeys.add(question.question.fileKey);
          }
          if (question.explanation?.fileKey) {
            allFileKeys.add(question.explanation.fileKey);
          }
          if (question.content?.fileKey) {
            allFileKeys.add(question.content.fileKey);
          }
          question.options.forEach((option) => {
            if (option.value.fileKey) {
              allFileKeys.add(option.value.fileKey);
            }
          });
        });

        // Read all files from IndexedDB
        const fileKeyToFile = new Map<string, File>();

        await Promise.all(
          Array.from(allFileKeys).map(async (fileKey) => {
            const fileObj = await getFileFromIndexedDB(fileKey);

            // @ts-expect-error: fileObj is returned as an object with 1 attr "file"; You must access file to actually get the file contents but TS doesnt know that
            const file = fileObj?.file as File;

            if (file) {
              fileKeyToFile.set(fileKey, file);
            } else {
              console.warn(`File not found or invalid for fileKey: ${fileKey}`);
            }
          }),
        );

        // Upload all files and get download URLs
        const storage = getStorage();
        const fileKeyToDownloadURL = new Map<string, string>();

        // Todo: Check whether the file already exists in the file base (Will save significant costs)
        await Promise.all(
          Array.from(fileKeyToFile.entries()).map(async ([fileKey, file]) => {
            const storageRef = ref(storage, fileKey);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            fileKeyToDownloadURL.set(fileKey, downloadURL);
          }),
        );

        // Update questions with download URLs
        const updatedQuestions = questions.map((question) => {
          const updatedQuestion: QuestionFormat = { ...question };

          // Update question body fileURL
          if (updatedQuestion.question?.fileKey) {
            const downloadURL = fileKeyToDownloadURL.get(
              updatedQuestion.question.fileKey,
            );
            if (downloadURL) {
              updatedQuestion.question = {
                ...updatedQuestion.question,
                fileURL: downloadURL,
              };
            }
          }

          // Update explanation fileURL
          if (updatedQuestion.explanation?.fileKey) {
            const downloadURL = fileKeyToDownloadURL.get(
              updatedQuestion.explanation.fileKey,
            );
            if (downloadURL) {
              updatedQuestion.explanation = {
                ...updatedQuestion.explanation,
                fileURL: downloadURL,
              };
            }
          }

          // Update content fileURL
          if (updatedQuestion.content?.fileKey) {
            const downloadURL = fileKeyToDownloadURL.get(
              updatedQuestion.content.fileKey,
            );
            if (downloadURL) {
              updatedQuestion.content = {
                ...updatedQuestion.content,
                fileURL: downloadURL,
              };
            }
          }

          // Update options fileURLs
          updatedQuestion.options = updatedQuestion.options.map((option) => {
            if (option.value.fileKey) {
              const downloadURL = fileKeyToDownloadURL.get(
                option.value.fileKey,
              );
              if (downloadURL) {
                return {
                  ...option,
                  value: {
                    ...option.value,
                    fileURL: downloadURL,
                  },
                };
              }
            }
            return option;
          });

          return updatedQuestion;
        });

        return updatedQuestions;
      };

      // Also a pain to deal with because blocks are not fun to deal with

      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
      const processTable = async (tableData: any) => {
        // tableData is an object with a content property that is an array of arrays.
        const table = tableData.content as any[][];

        const tableAsObject = table.reduce(
          (acc, row, index) => {
            acc[`row${index}`] = row;
            return acc;
          },
          {} as Record<string, any[]>,
        );

        return tableAsObject;
      };

      // Traverse through data to find QuestionFormat[] arrays
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

    setShowDropdown(false);
  };
  
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="flex justify-end">
        <Button className="bg-blue-500 hover:bg-blue-600" onClick={openSaveModal}>
          <Save className="mr-2" /> Save Changes
        </Button>
      </div>

      {showDropdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex gap-8 rounded-lg bg-white p-4">
            <button
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => handleSave()}
            >
              Save
            </button>
            <button
              className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              onClick={() => setShowDropdown(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 pb-8",
          className,
        )}
      >
        <div className="overflow-y-auto rounded border border-gray-300 p-4 px-8">
          <Editor
            content={initialData}
            setData={setData}
            setUnsavedChanges={setUnsavedChanges}
          />
        </div>

        <div className="px-8">
          <div className="my-4 pb-4 opacity-50">Output:</div>

          <Renderer content={data} />
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
