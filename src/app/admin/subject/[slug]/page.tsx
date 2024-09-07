"use client";
import { getUser } from "@/components/hooks/users";
import SubjectSidebar from "@/components/subjectHomepage/subject-sidebar";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { db } from "@/lib/firebase";
import { Subject } from "@/types";
import { User } from "@/types/user";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

// set empty data if non-existent
const mockData: Record<string, Subject> = {
  "calculus-ab": {
    title: "AP Calculus AB",
    units: [
      {
        unit: 1,
        title: "Limits and Continuity",
        chapters: [
          {
            chapter: 1,
            title: "Introducing Calculus: Can Change Occur at an Instant?",
          },
          {
            chapter: 2,
            title: "Defining Limits and Using Limit Notation",
          },
          {
            chapter: 3,
            title: "Estimating Limit Values from Graphs",
          },
          {
            chapter: 4,
            title: "Estimating Limit Values from Tables",
          },
          {
            chapter: 5,
            title: "Determining Limits Using Algebraic Properties of Limits",
          },
          {
            chapter: 6,
            title: "Determining Limits Using Algebraic Manipulation",
          },
          {
            chapter: 7,
            title: "Selecting Procedures for Determining Limits",
          },
          {
            chapter: 8,
            title: "Determining Limits Using the Squeeze Theorem",
          },
          {
            chapter: 9,
            title: "Connecting Multiple Representations of Limits",
          },
          {
            chapter: 10,
            title: "Exploring Types of Discontinuities",
          },
          {
            chapter: 11,
            title: "Defining Continuity at a Point",
          },
          {
            chapter: 12,
            title: "Confirming Continuity over an Interval",
          },
          {
            chapter: 13,
            title: "Removing Discontinuities",
          },
          {
            chapter: 14,
            title: "Connecting Infinite Limits and Vertical Asymptotes",
          },
          {
            chapter: 15,
            title: "Connecting Limits at Infinity and Horizontal Asymptotes",
          },
          {
            chapter: 16,
            title: "Working with the Intermediate Value Theorem (IVT)",
          },
        ],
      },
      {
        unit: 2,
        title: "Differentiation: Definition and Basic Derivative Rules",
        chapters: [
          {
            chapter: 1,
            title:
              "Defining Average and Instantaneous Rates of Change at a Point",
          },
          {
            chapter: 2,
            title:
              "Defining the Derivative of a Function and Using Derivative Notation",
          },
          {
            chapter: 3,
            title: "Estimating Derivatives of a Function at a Point",
          },
          {
            chapter: 4,
            title:
              "Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist",
          },
          {
            chapter: 5,
            title: "Applying the Power Rule",
          },
          {
            chapter: 6,
            title:
              "Derivative Rules: Constant, Sum, Difference, and Constant Multiple",
          },
          {
            chapter: 7,
            title: "Derivatives of cos x, sin x, e^x, and ln x",
          },
          {
            chapter: 8,
            title: "The Product Rule",
          },
          {
            chapter: 9,
            title: "The Quotient Rule",
          },
          {
            chapter: 10,
            title:
              "Finding the Derivatives of Tangent, Cotangent, Secant, and/or Cosecant Functions",
          },
        ],
      },
    ],
  },
  statistics: {
    title: "AP Statistics",
    units: [
      {
        unit: 1,
        title: "Introduction to Probability",
        chapters: [
          {
            chapter: 1,
            title: "Probability and Random Variables",
          },
          {
            chapter: 2,
            title: "Probability Spaces and Events",
          },
          {
            chapter: 3,
            title: "Conditional Probability",
          },
          {
            chapter: 4,
            title: "Independence and Dependence",
          },
        ],
      },
    ],
  },
};

const Page = ({ params }: { params: { slug: string } }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try{
        const fetchedUser = await getUser();
        setUser(fetchedUser);
      }catch(error){
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);
  
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        // if (user && (user?.access === "admin" || user?.access === "member")) { 
        //   // Reference to the document in Firestore using the slug
        //   const docRef = doc(db, "subjects", params.slug);
        //   const docSnap = await getDoc(docRef);

        //   if (docSnap.exists()) {
        //     // Convert Firestore document data to Subject type
        //     setSubject(docSnap.data() as Subject);
        //   } else {
        //     setSubject(null);
        //   }
        // }else{
        //   setError("Failed to fetch subject data. Lol");
        // }

        const data = mockData[params.slug.toLowerCase()];
        if (data) {
          setSubject(data);
        } else {
          console.error("No data found for slug:", params.slug);
          setError("Subject not found. That's probably us, not you.");
        }
      } catch (error) {
        console.log("Error fetching subject data:", error);
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [user, params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  const handleSave = async () => {
    try {
      if (user && (user?.access === "admin" || user?.access === "member")) { 
      console.log("Saving...", subject);    
      // Save to Firestore
      await setDoc(doc(db, "subjects", params.slug), subject);

      setSubject(subject);
      }else{
        console.error("Error saving new unit and chapter:", error);  
      }
    } catch (error) {
      console.error("Error saving new unit and chapter:", error);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <SubjectSidebar subject={subject} />

      <div className="relative flex grow flex-col">
        <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

        <div className="relative flex grow flex-col">
          <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
            <div className="grow">
              <h1 className="flex justify-center py-8 text-5xl font-black">
                {subject.title}
              </h1>
              <h2 className="min-w-full py-8 text-center text-2xl font-black">
                Click on a unit or chapter to view its content. On the sidebar,
                you can create new units and chapters.
              </h2>

              <div className="flex min-w-full justify-center">
                <button
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Show new Unit and Chapter updates to users. (Save)
                </button>
              </div>
            </div>
          </div>

          <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
        </div>
      </div>
    </div>
  );
};

export default Page;
