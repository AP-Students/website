import { useEffect, useState } from "react";
import { openDB } from "idb"; // IndexedDB wrapper
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { revertTableObjectToArray, getKey } from "@/app/article-creator/_components/FetchArticleFunctions";
import { Subject } from "@/types";
import { Content } from "@/types/content";

const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

export const useFetchAndCache = (user: any, params: any) => {  
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
    const cached = await db.get("subject", title);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION_MS) {
      return cached.data;
    }
    return null; // Cache expired or not found
  };

  // Retrieve cached content with expiration check
  const getCachedContent = async (title: string) => {
    const db = await openDatabase();
    const cached = await db.get("content", title);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION_MS) {
      return cached.data;
    }
    return null; // Cache expired or not found
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && (user.access === "admin" || user.access === "member")) {

          // Fetch subject from cache or Firestore
          const cachedSubject = await getCachedSubject(params.slug);
          if (cachedSubject) {
            setSubject(cachedSubject);
          } else {
            const subjectDocRef = doc(db, "subjects", params.slug);
            const subjectDocSnap = await getDoc(subjectDocRef);
            if (subjectDocSnap.exists()) {
              const data = subjectDocSnap.data() as Subject;
              setSubject(data);
              await cacheSubject(params.slug, data); // Cache subject
            } else {
              setError("Subject not found. That's probably us, not you.");
            }
          }

          // Fetch content from cache or Firestore
          const key = getKey();
          const cachedContent = await getCachedContent(key);
          if (cachedContent) {
            setContent(cachedContent);
          } else {
            const pageDocRef = doc(db, "pages", key);
            const pageDocSnap = await getDoc(pageDocRef);
            if (pageDocSnap.exists()) {
              const data = pageDocSnap.data()?.data;
              revertTableObjectToArray(data);
              const contentData = { ...pageDocSnap.data(), data } as Content;
              setContent(contentData);
              await cacheContent(key, contentData); // Cache content
            } else {
              setError("Content not found. That's probably us, not you.");
            }
          }
        }
      } catch (error) {
        setError("Failed to fetch subject or content data.");
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      fetchData();
    }
  }, [user]);

  return { subject, content, loading, error };
};
