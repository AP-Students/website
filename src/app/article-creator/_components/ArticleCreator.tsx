"use client";

import React, { useEffect, useState } from "react";
import { type OutputData } from "@editorjs/editorjs";
import Renderer from "./Renderer";
import Editor from "./Editor";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getUser } from "@/components/hooks/users";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

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
        const user = await getUser();
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const pathParts = window.location.pathname.split("/").slice(-3);
          const docRef = doc(db, "pages", pathParts.join("-"));
          const docSnap = await getDoc(docRef);
          setInitialData(docSnap.data()?.data as OutputData);
          setData(docSnap.data()?.data as OutputData);
        }
      } catch (error) {
        console.log("Error fetching subject data:", error);
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
    console.log("user", user);
    const pathParts = window.location.pathname.split("/").slice(-3);

    const newArticle = {
      id: uuidv4(),
      createdAt: new Date(),
      creator: user!,
      title: pathParts.join("/"),
      data,
    };

    try {
      if (user && user.access === "admin") {
        const docRef = doc(db, "pages", pathParts.join("-"));
        await setDoc(docRef, newArticle);

        alert(`Article saved: ${docRef.id}`);
      } else {
        alert("User is not authorized to perform this action.");
      }
    } catch (error) {
      alert("Error saving article.");
      console.error("Error adding document: ", error);
    }

    setShowDropdown(false);
  };

  return (
    <>
      <button
        className="group relative ml-auto mt-4 flex items-center rounded-md bg-green-500 p-2 text-white hover:bg-green-600 md:mr-4 lg:mr-8"
        onClick={handleSave}
      >
        <FontAwesomeIcon icon={faCheckCircle} />

        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:flex">
          Submit content
        </span>
      </button>
      
      {showDropdown && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content z-60 rounded-md bg-white p-4">
            {/* Save Button for Confirming the Selection */}
            <div className="mt-3 flex justify-between min-w-36">
              <button
                className="rounded-md bg-green-500 p-2 text-white hover:bg-green-600"
                onClick={() => handleTitleSelect()}
              >
                Save
              </button>
              <button
                className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                onClick={() => setShowDropdown(false)}
              >
                Close
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
          <Editor content={initialData} setData={setData} />
        </div>

        <div className="px-8">
          <div className="mb-4 pb-4 opacity-50">Output:</div>

          {/* Render the editor output */}
          <div>
            <Renderer content={data} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ArticleCreator;
