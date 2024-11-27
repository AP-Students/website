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
import { CloudUpload } from "lucide-react";
import { getFileFromIndexedDB } from "./custom_questions/RenderAdvancedTextbox";
import { QuestionFormat } from "@/types/questions";
import Renderer from "./Renderer";
import { revertTableObjectToArray, getKey } from "./FetchArticleFunctions";

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
    const fetchSubject = async () => {
      try {
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
      } catch (error: any) {
        console.log("Error fetching subject data:", error.message);
      }
    };

    fetchSubject();
  }, []);

  const handleSave = async () => {
    if (!data) {
      alert("Please enter the content.");
      return;
    }

    setShowDropdown(true); // Show the dropdown to select the title
  };
  const handleTitleSelect = async () => {
    const user = await getUser();
    const pathParts = window.location.pathname.split("/").slice(-3);

    if (!user || (user.access !== "admin" && user.access !== "member")) {
      alert("User is not authorized to perform this action.");
      return;
    }

    const newArticle = {
      id: uuidv4(),
      createdAt: new Date(),
      creator: user!,
      title: pathParts.join("/"),
      data,
    };

    try {
      const docRef = doc(db, "pages", pathParts.join("-"));

      // Function to process questions and upload files
      const processQuestions = async (questions: QuestionFormat[]) => {
        if (!user || (user.access !== "admin" && user.access !== "member")) {
          alert("User is not authorized to perform this action.");
          return;
        }

        return await Promise.all(
          questions.map(async (questionInstance: QuestionFormat) => {
            let updatedQuestion = { ...questionInstance };
            const storage = getStorage();

            // Create an array of promises for the body, options, and explanation uploads
            const uploadPromises: Promise<any>[] = [];

            // Handle body fileKey
            if (updatedQuestion.question?.fileKey) {
              uploadPromises.push(
                (async () => {
                  const fileObj = await getFileFromIndexedDB(
                    updatedQuestion.question.fileKey!,
                  );
                  // @ts-ignore - fileObj is obj with id and file
                  const file = fileObj?.file;

                  if (file && file instanceof File) {
                    const storageRef = ref(
                      storage,
                      `${questionInstance.question.fileKey}`,
                    );
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    updatedQuestion = {
                      ...updatedQuestion,
                      question: {
                        ...updatedQuestion.question,
                        fileURL: downloadURL,
                      },
                    };
                  }
                })(),
              );
            }

            // Handle options with fileKeys (batching file uploads for options)
            const updatedOptionsPromises = questionInstance.options.map(
              async (option) => {
                if (option.value.fileKey) {
                  const fileObj = await getFileFromIndexedDB(
                    option.value.fileKey,
                  );
                  // @ts-ignore - fileObj is obj with id and file
                  const file = fileObj?.file;

                  if (file && file instanceof File) {
                    const storageRef = ref(storage, `${option.value.fileKey}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    return {
                      ...option,
                      value: {
                        ...option.value,
                        fileURL: downloadURL,
                      },
                    };
                  }
                }
                return option; // Return the original option if no fileKey
              },
            );

            // Add the options uploads to the uploadPromises
            uploadPromises.push(
              Promise.all(updatedOptionsPromises).then((updatedOptions) => {
                updatedQuestion.options = updatedOptions;
              }),
            );

            // Handle explanation fileKey
            if (questionInstance.explanation?.fileKey) {
              uploadPromises.push(
                (async () => {
                  const fileObj = await getFileFromIndexedDB(
                    questionInstance.explanation.fileKey!,
                  );
                  // @ts-ignore - fileObj is obj with id and file
                  const file = fileObj?.file;

                  if (file && file instanceof File) {
                    const storageRef = ref(
                      storage,
                      `${questionInstance.explanation.fileKey}`,
                    );
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    updatedQuestion.explanation = {
                      ...questionInstance.explanation,
                      fileURL: downloadURL,
                    };
                  }
                })(),
              );
            }

            // Wait for all file uploads to complete
            await Promise.all(uploadPromises);

            return updatedQuestion;
          }),
        );
      };

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
      const updatedData = await Promise.all(
        Object.entries(data.blocks).map(async ([key, value]) => {
          // Check if the array contains objects of type QuestionFormat
          if (value.type === "questionsAddCard") {
            const updatedQuestions = await processQuestions(
              value.data.questions as QuestionFormat[],
            );
            value.data.questions = updatedQuestions;
            return value;
          }

          if (value.type === "table") {
            const updatedTable = await processTable(value.data);
            value.data.content = updatedTable;
            return value;
          }

          return value; // If not an array of questions, return original value
        }),
      );

      // @ts-ignore - blocks is an Array
      newArticle.data.blocks = updatedData;
      await setDoc(docRef, newArticle);

      alert(`Article saved: ${docRef.id}`);
    } catch (error) {
      console.error("Error saving article:", error);

      alert("Error saving article.");
    }

    setShowDropdown(false);
  };

  return (
    <>
      <button
        className="ml-auto mt-4 flex items-center rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 md:mr-4 lg:mr-8"
        onClick={handleSave}
      >
        <CloudUpload className="mr-2 inline" /> Save Article
      </button>

      {showDropdown && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content z-60 rounded-md bg-white p-4">
            {/* Save Button for Confirming the Selection */}
            <div className="mt-3 flex min-w-36 justify-between">
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={() => handleTitleSelect()}
              >
                Save
              </button>
              <button
                className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                onClick={() => setShowDropdown(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 divide-y-2 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0",
          className,
        )}
      >
        <div className="overflow-y-auto rounded border p-4 px-8">
          <Editor content={initialData} setData={setData} />
        </div>

        <div className="px-8">
          <h2 className="pb-8 opacity-50">Preview:</h2>
          <Renderer content={data} />
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
