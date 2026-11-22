import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { getCoverageDocRef } from "@/lib/firestore/gradingCoverage";

export interface GradingCoverageState {
  loading: boolean;
  // The gradingCoverage/frq doc, or undefined if filtering is off (no doc)
  // or it couldn't be loaded.
  data?: Record<string, unknown>;
}

// Live, so a change on the admin page shows up for students straight away.
export function useGradingCoverage(): GradingCoverageState {
  const [state, setState] = useState<GradingCoverageState>({ loading: true });

  useEffect(
    () =>
      onSnapshot(
        getCoverageDocRef(),
        (snapshot) => setState({ loading: false, data: snapshot.data() }),
        (error) => {
          // Treated like "filtering is off", so students can still submit.
          console.error("Couldn't load the list of graded subjects:", error);
          setState({ loading: false });
        },
      ),
    [],
  );

  return state;
}
