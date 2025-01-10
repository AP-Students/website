import { useEffect, useState } from "react";
import { openDB } from "idb"; // IndexedDB wrapper
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  revertTableObjectToArray,
  getKey,
} from "@/components/article-creator/FetchArticleFunctions";
import { type Subject } from "@/types/firestore";
import { type Content } from "@/types/content";
import { type OutputData } from "@editorjs/editorjs";
import { getUser } from "@/components/hooks/users";

type Params = {
  slug: string;
  unit: string;
  articleNumber: string;
};

const CACHE_EXPIRATION_MS = 2 * 24 * 60 * 60 * 1000; // 48 hrs in milliseconds (Probably increase this signficiantly)

// params: { slug: string; unit: string; articleNumber: string }
// admin: Used to prevent caches === rapid feedback
export const useFetchAndCache = (params: Params, admin?: boolean) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Open IndexedDB database
  const openDatabase = async () => {
    return openDB("CacheDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("subject")) {
          db.createObjectStore("subject", { keyPath: "title" });
        }
        if (!db.objectStoreNames.contains("content")) {
          db.createObjectStore("content", { keyPath: "title" });
        }
      },
    });
  };

  // Cache subject data with timestamp
  const cacheSubject = async (title: string, data: Subject) => {
    const db = await openDatabase();
    const cachedData = { title, data, timestamp: Date.now() };
    await db.put("subject", cachedData);
  };

  // Cache content data with timestamp
  const cacheContent = async (title: string, data: Content) => {
    const db = await openDatabase();
    const cachedData = { title, data, timestamp: Date.now() };
    await db.put("content", cachedData);
  };

  // Retrieve cached subject with expiration check
  const getCachedSubject = async (title: string) => {
    const db = await openDatabase();
    const cached = (await db.get("subject", title)) as {
      title: string;
      data: Subject;
      timestamp: number;
    };
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION_MS) {
      return cached.data;
    }
    return null; // Cache expired or not found
  };

  // Retrieve cached content with expiration check
  const getCachedContent = async (title: string) => {
    const db = await openDatabase();
    const cached = (await db.get("content", title)) as {
      title: string;
      data: Content;
      timestamp: number;
    };
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION_MS) {
      return cached.data;
    }
    return null; // Cache expired or not found
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subject from cache or Firestore
        const cachedSubject = await getCachedSubject(params.slug);
        const user = await getUser();
        if (cachedSubject && user?.access === "user") {
          setSubject(cachedSubject);
        } else {
          console.log("Hitting Firestore for subject data");
          const subjectDocRef = doc(db, "subjects", params.slug);
          const subjectDocSnap = await getDoc(subjectDocRef);

          if (subjectDocSnap.exists()) {
            const data = subjectDocSnap.data() as Subject;
            setSubject(cachedSubject);
            if (!admin) {
              await cacheSubject(params.slug, data);
            }
          } else {
            setError("Subject not found. That's probably us, not you.");
          }
        }

        // Fetch content from cache or Firestore
        const key = getKey(); // This is probably where the issue is steming from for content?
        const cachedContent = await getCachedContent(key);
        if (cachedContent) {
          setContent(cachedContent);
        } else {
          const pageDocRef = doc(
            db,
            "subjects",
            params.slug,
            params.unit.split("-").slice(0, 2).join("-"),
            params.articleNumber.split("-").slice(0, 2).join("-"),
          );
          const pageDocSnap = await getDoc(pageDocRef);
          if (pageDocSnap.exists()) {
            const data = pageDocSnap.data()?.data as OutputData;
            revertTableObjectToArray(data);
            const contentData = { ...pageDocSnap.data(), data } as Content;
            setContent(contentData);
            await cacheContent(key, contentData); // Cache content
          } else {
            setError("Content not found. That's probably us, not you.");
          }
        }
      } catch (error) {
        setError("Failed to fetch subject or content data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch((error) => {
      console.error("Error fetching subject or content data:", error);
    });
    //eslint-disable react-hooks/exhaustive-deps - Do this because it only triggers for component mount; rest of vars dont change.
  }, []);

  return { subject, content, loading, error };
};
