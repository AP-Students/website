import type { QuestionFormat } from "@/types/questions";
import { type OutputData } from "@editorjs/editorjs";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFileFromIndexedDB } from "./custom_questions/RenderAdvancedTextbox";

export interface ImageData {
  caption: string;
  stretched: boolean;
  url: string; // Base64 string or a URL
  withBackground: boolean;
  withBorder: boolean;
}

export interface TableData {
  content: string[][]; // 2D array representing table rows and columns
  rows: number;
  cols: number;
}

// Processing Data:
// Function to process questions and upload files
export const processQuestions = async (
  questions: QuestionFormat[],
): Promise<QuestionFormat[]> => {
  // Collect all unique fileKeys from questions

  const allFileKeys = new Set<string>();

  questions.forEach((question) => {
    const allFiles = [
      ...(question.question?.files || []),
      ...(question.explanation?.files || []),
      ...(question.content?.files || []),
      ...question.options.flatMap((option) => option.value.files || []),
    ];

    allFiles.forEach((file) => allFileKeys.add(file.key));
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

    const allFiles = [
      ...(updatedQuestion.question?.files || []),
      ...(updatedQuestion.explanation?.files || []),
      ...(updatedQuestion.content?.files || []),
      ...updatedQuestion.options.flatMap((option) => option.value.files || []),
    ];

    allFiles.forEach((file) => {
      const downloadURL = fileKeyToDownloadURL.get(file.key);
      if (downloadURL) {
        file.url = downloadURL;
      }
    });

    return updatedQuestion;
  });

  return updatedQuestions;
};

// Also a pain to deal with because blocks are not fun to deal with
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
export const processTable = async (tableData: TableData) => {
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

export const processImage = async (
  imageData: ImageData,
): Promise<{ fileKey: string; caption?: string; url: string }> => {
  const storage = getStorage();

  const { url, caption } = imageData; // Extract Base64 URL and metadata

  // Decode Base64 into a Blob
  const blob = base64ToBlob(url);

  // Generate a unique file key for the image
  const fileKey = `images/${caption || `image-${Date.now()}`}`;

  // Upload Blob to Firebase Storage
  const storageRef = ref(storage, fileKey);
  const snapshot = await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // Return updated image data with Firebase URL reference
  return { fileKey, caption, url: downloadURL };
};

// Utility: Convert Base64 string to a Blob
const base64ToBlob = (base64: string): Blob => {
  const [prefix, data] = base64.split(",");
  const contentType = prefix?.match(/:(.*?);/)?.[1] ?? "";
  const byteCharacters = atob(data!);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);

  return new Blob([byteArray], { type: contentType });
};

// If you looked at article creator yk, you'll see this
// But basically idk the block structure/types, so I can't really typecheck except use any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
export const revertTableObjectToArray = (data: OutputData) => {
  const table = data.blocks.find((block) => block.type === "table");
  if (table) {
    const contentAsObject = table.data.content as Record<string, any[]>;

    // Convert the object (with keys like row0, row1, ...) back to an array of arrays
    const contentAsArray = Object.keys(contentAsObject)
      .sort() // Ensure the rows are in correct order, just in case
      .map((key) => contentAsObject[key]);

    // Update the data to replace the object back with an array
    data.blocks[data.blocks.indexOf(table)] = {
      ...table,
      data: {
        ...table.data,
        content: contentAsArray,
      },
    };
  }
};

/* eslint-enable */

export const getKey = () => {
  const pathParts = window.location.pathname.split("/").slice(-3);
  const key = pathParts.join("-");
  return key;
};
