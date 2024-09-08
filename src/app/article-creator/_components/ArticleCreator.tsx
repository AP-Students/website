"use client";

import React, { useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Renderer from "./Renderer";
import Editor from "./Editor";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getUser } from "@/components/hooks/getUser";
import { CloudUpload } from "lucide-react";

// All AP classes sorted alphabetically
// This should be subject; Extracted from db and made dynamic given the ap class
// Will implement later when the admin page is established
const apClasses = [
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP Art History",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Chinese",
  "AP Comparative Government",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Drawing",
  "AP English Language",
  "AP English Literature",
  "AP Environmental Science",
  "AP European History",
  "AP French",
  "AP German",
  "AP Human Geography",
  "AP Italian",
  "AP Japanese",
  "AP Latin",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Music Theory",
  "AP Physics 1",
  "AP Physics 2",
  "AP Physics C: E&M",
  "AP Physics C: Mechanics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language",
  "AP Spanish Literature",
  "AP Statistics",
  "AP US History",
  "AP United States Government",
  "AP World History: Modern",
].sort();

function ArticleCreator({ className }: { className?: string }) {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
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

  const [searchTerm, setSearchTerm] = useState<string>("");
  const filteredClasses = apClasses.filter((apClass) =>
    apClass.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSave = async () => {
    if (!data) {
      alert("Please enter the content.");
      return;
    }

    const user = await getUser();
    if (!user) {
      alert("You must be logged in to save an article.");
      return;
    }

    setShowDropdown(true); // Show the dropdown to select the title
  };

  const handleTitleSelect = async (selectedTitle: string) => {
    const user = await getUser();

    const formattedTitle = selectedTitle
      .replace(/AP /g, "")
      .toLowerCase()
      .replace(/[^a-z1-9 ]+/g, "")
      .replace(/\s/g, "-");

    const newArticle = {
      id: uuidv4(),
      createdAt: new Date(),
      creator: user!.uid,
      title: formattedTitle,
      data,
    };

    try {
      if (user && user.admin) {
        const customDocId = uuidv4();
        const docRef = doc(db, "page", formattedTitle);
        await setDoc(docRef, newArticle);

        alert(`Article saved: ${docRef.id}`);
      } else {
        alert("User is not authorized to perform this action.");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }

    setShowDropdown(false);
  };

  return (
    <>
      <button
        className="ml-auto mt-4 flex items-center rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
        onClick={handleSave}
      >
        <CloudUpload className="mr-2 inline" /> Save Article
      </button>
      {/* Modal for Selecting AP Class */}
      {showDropdown && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content z-60 rounded-md bg-white p-4">
            <h2 className="mb-3 text-lg font-bold">
              Select AP Class for Title
            </h2>
            <input
              type="text"
              className="mb-3 w-full rounded-md border p-2"
              placeholder="Search for a class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="class-list max-h-80 overflow-y-auto">
              {filteredClasses.map((apClass) => (
                <li
                  key={apClass}
                  className={`cursor-pointer rounded-md p-2 hover:bg-gray-200 ${
                    selectedClass === apClass ? "bg-gray-300" : ""
                  }`}
                  onClick={() => setSelectedClass(apClass)}
                >
                  {apClass}
                </li>
              ))}
            </ul>

            {/* Save Button for Confirming the Selection */}
            <div className="mt-3 flex justify-between">
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={() => handleTitleSelect(selectedClass)} // Use the selected class
              >
                Save
              </button>
              <button
                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
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
        <div className="px-8">
          <Editor setData={setData} />
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
