"use client";

import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { deleteDoc, collection, doc, getDoc, getCountFromServer, getDocs, limit, orderBy, query, startAfter, type DocumentData, type QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"

type UngradedFrqRow = {
  id: string;
  templateId: string;
  studentId: string;
  submittedAt: Timestamp | null;
  responses: Record<string, string>;
  frqTitle: string;
  subject: string;
  unitId: string;
  isMalformed: boolean;
};

const PAGE_SIZE = 60;

type PageCursor =
  QueryDocumentSnapshot<DocumentData> | null;

const Page = () => {
  const [frqs, setFrqs] = useState<UngradedFrqRow[] | null>(null);

  const [frqToDelete, setFrqToDelete] = useState<UngradedFrqRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [totalCount, setTotalCount] = useState<number | null>(
  null,
);

  const [pageIndex, setPageIndex] = useState(0);

  const [pageCursors, setPageCursors] = useState<PageCursor[]>([
    null,
  ]);

  const [pageEndCursor, setPageEndCursor] =
    useState<PageCursor>(null);

  const [hasNextPage, setHasNextPage] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(false);


    const fetchFrqs = useCallback(async (cursor: PageCursor) => {
      setIsPageLoading(true);
      try {
        const collectionRef = collection(
          db,
          "gradableFrqSubmissions",
        );

      const pageQuery = cursor
        ? query(
            collectionRef,
            orderBy("submittedAt", "desc"),
            startAfter(cursor),
            limit(PAGE_SIZE + 1),
          )
        : query(
            collectionRef,
            orderBy("submittedAt", "desc"),
            limit(PAGE_SIZE + 1),
          );

      const snapshot = await getDocs(pageQuery);
      const pageDocuments = snapshot.docs.slice(0, PAGE_SIZE);

      setHasNextPage(snapshot.docs.length > PAGE_SIZE);
      setPageEndCursor(pageDocuments.at(-1) ?? null);

      const rows = await Promise.all(  
        pageDocuments.map(async (submissionDoc) => {
          const rawData = submissionDoc.data();

          const templateId =
            typeof rawData.templateId === "string" ? rawData.templateId : "";

          const studentId =
            typeof rawData.studentId === "string" ? rawData.studentId : "";

          const submittedAt =
            rawData.submittedAt instanceof Timestamp
              ? rawData.submittedAt
              : null;

          const rawResponses: unknown = rawData.responses;
          const hasValidResponses =
          typeof rawResponses === "object" &&
          rawResponses !== null &&
          !Array.isArray(rawResponses);

          const responses: Record<string, string> = hasValidResponses
            ? Object.fromEntries(
                Object.entries(rawResponses).filter(
                  (entry): entry is [string, string] => typeof entry[1]=="string"
                ),
              )
            : {};

          let isMalformed =
            templateId === "" ||
            studentId === "" ||
            submittedAt === null ||
            !hasValidResponses;
          
          let frqTitle = "Unknown FRQ";
          let subject = "Unknown subject";
          let unitId = "Unknown unit";

          if (templateId !== "") {
            try {
              const templateSnapshot = await getDoc(
                doc(db, "frqTemplates", templateId),
              );

              if (templateSnapshot.exists()) {
                const templateData = templateSnapshot.data();

                if (typeof templateData.title === "string") {
                  frqTitle = templateData.title;
                } else {
                  isMalformed = true;
                }

                if (typeof templateData.subject === "string") {
                  subject = templateData.subject;
                } else {
                  isMalformed = true;
                }

                if (typeof templateData.unitId === "string") {
                  unitId = templateData.unitId;
                } else {
                  isMalformed = true;
                }
              } else {
                isMalformed = true;
              }
            } catch (error) {
              console.error(
                `Unable to load template for submission ${submissionDoc.id}:`,
                error,
              );
              isMalformed = true;
            }
          }

          return {
            id: submissionDoc.id,
            templateId: templateId || "Missing",
            studentId: studentId || "Unknown",
            submittedAt,
            responses,
            isMalformed,
            frqTitle,
            subject,
            unitId
          };
        }),
      );
      setFrqs(rows);
      } catch (error) {
      console.error("Error fetching ungraded FRQs:", error);
      setFrqs([]);
    } finally {
      setIsPageLoading(false);
    }
    }, []);


    useEffect(() => {
      const initializePage = async () => {
        const countSnapshot = await getCountFromServer(
          collection(db, "gradableFrqSubmissions"),
        );

        setTotalCount(countSnapshot.data().count);
        await fetchFrqs(null);
      };

      initializePage().catch((error) => {
        console.error(
          "Error initializing ungraded FRQs:",
          error,
        );
        setFrqs([]);
      });
    }, [fetchFrqs]);


const handleNextPage = async () => {
  if (
    !hasNextPage ||
    !pageEndCursor ||
    isPageLoading
  ) {
    return;
  }

  const nextPageIndex = pageIndex + 1;

  setPageCursors((currentCursors) => {
    const updatedCursors = [...currentCursors];
    updatedCursors[nextPageIndex] = pageEndCursor;
    return updatedCursors;
  });

  setPageIndex(nextPageIndex);
  await fetchFrqs(pageEndCursor);
};

const handlePreviousPage = async () => {
  if (pageIndex === 0 || isPageLoading) {
    return;
  }

  const previousPageIndex = pageIndex - 1;
  const previousPageCursor =
    pageCursors[previousPageIndex] ?? null;

  setPageIndex(previousPageIndex);
  await fetchFrqs(previousPageCursor);
};


  const handleDelete = async () => {
    if (!frqToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDoc(
        doc(db, "gradableFrqSubmissions", frqToDelete.id));

      setFrqs((currentFrqs) =>
        currentFrqs
          ? currentFrqs.filter(
              (frq) => frq.id !== frqToDelete.id,
            )
          : currentFrqs,
      );

      setFrqToDelete(null);
      setTotalCount((currentCount) =>
        currentCount === null
          ? null
          : Math.max(currentCount - 1, 0),
      );
      
    } catch (error) {
      console.error("Error deleting ungraded FRQ:",
        error,
      );

      window.alert(
        "Unable to delete this FRQ. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (frqs === null) {
    return <div>Loading...</div>;
  }

  return (
  <div className="flex min-h-screen flex-col">
      <Navbar />
    <main className="mx-auto mt-12 w-full max-w-6xl flex-1 px-8 pb-8">


        <div className="flex items-end justify-between gap-6">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            Ungraded FRQs
          </h1>

          <p className="shrink-0 text-4xl font-bold tabular-nums lg:text-5xl">
            ({totalCount?.toLocaleString() ?? "—"})
          </p>
        </div>

      {frqs.length === 0 ? (
        <div className="mt-8 rounded-md border border-yellow-400 bg-yellow-50 p-4">
          <p>No ungraded FRQs found.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-gray-300 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-sm font-semibold">
                <tr>
                  <th className="px-4 py-3">FRQ</th>
                  <th className="px-4 py-3">Submission ID</th>
                  <th className="px-4 py-3">Test Taker</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-center">Responses</th>
                  <th className="px-4 py-3 text-center">Actions</th>

                </tr>
              </thead>

              <tbody className="divide-y">
                {frqs.map((frq) => (
              <tr
                key={frq.id}
                className={frq.isMalformed ? "bg-red-50 transition-colors hover:bg-red-100" : "transition-colors hover:bg-gray-50"}
              >
              <td className="px-4 py-3">
                <p className="font-semibold">{frq.frqTitle}</p>
                {frq.isMalformed && (
                  <p className="mt-1 text-xs font-semibold text-red-700">
                    Malformed submission
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-gray-500">
                  FRQ ID: {frq.templateId}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {frq.subject} · {frq.unitId}
                </p>
              </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {frq.id}
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {frq.studentId}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {frq.submittedAt ? frq.submittedAt.toDate().toLocaleString() : "Unknown"}
                </td>
                <td className="px-4 py-3 text-center">
                  {Object.keys(frq.responses).length}
                </td>


                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                      {frq.isMalformed ? (
                        <Button disabled title="This submission contains invalid data">
                          Grade
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href={`/frq-grading/${frq.id}`}>Grade</Link>
                        </Button>
                      )}
                    <button type="button" aria-label={`Delete submission ${frq.id}`}
                    title="Delete submission"
                    onClick={() => setFrqToDelete(frq)}
                    className="inline-flex size-10 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    >
                      <Trash2 aria-hidden="true" className="size-5"/>
                    </button>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous page"
          title="Previous page"
          disabled={pageIndex === 0 || isPageLoading}
          onClick={() => void handlePreviousPage()}
          className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>

        <p className="min-w-20 text-center font-semibold tabular-nums">
          Page {pageIndex + 1}
        </p>

        <button
          type="button"
          aria-label="Next page"
          title="Next page"
          disabled={!hasNextPage || isPageLoading}
          onClick={() => void handleNextPage()}
          className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </main>

    <Dialog
      open={frqToDelete !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setFrqToDelete(null);
        }
      }}
    >
      <DialogContent className="max-w-md rounded-lg border-gray-300 shadow-lg">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>

          <DialogDescription>
            This will permanently delete the ungraded submission
            {frqToDelete ? ` "${frqToDelete.frqTitle}" from ${frqToDelete.studentId}` : ""}. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => setFrqToDelete(null)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Footer className="w-full"/>
  </div>
);
};

export default Page;
