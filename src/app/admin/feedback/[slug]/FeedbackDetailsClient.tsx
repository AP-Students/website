/* eslint-disable */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface FeedbackDetailsClientProps {
  slug: string;
}

function parseMarkdown(text: string): string {
  if (!text) return '';
  const rawHtml = marked(text) as string;
  return DOMPurify.sanitize(rawHtml);
}

interface FeedbackItem {
  type: string;
  title: string;
  bugType?: string;
  bugUrl?: string;
  message: string;
  email: string;
  attachedImage?: string;
  isResolved?: boolean;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  // Feature request specific fields
  featureProblem?: string;
  featureAlternatives?: string;
  featureSolution?: string;
  featureContextUrl?: string;
}

export default function FeedbackDetailsClient({ slug }: FeedbackDetailsClientProps) {
  const router = useRouter();
  const [bug, setBug] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchSingleFeedback = async () => {
      try {
        const docRef = doc(db, 'feedback', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBug(docSnap.data() as FeedbackItem);
        } else {
          console.error("No such document found!");
        }
      } catch (err) {
        console.error("Error pulling document context:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleFeedback();
  }, [slug]);

  const handleCreateGitHubIssue = async () => {
    if (!bug) return;

    setIsCreatingIssue(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('You must be signed in to do this.');
      }

      const response = await fetch('/api/feedback/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ feedbackId: slug }),
      });

      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? `Request failed with status ${response.status}`);
      }

      alert("GitHub Issue created successfully!");
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to create GitHub issue:", err);
      alert(`Error creating GitHub issue: ${errorMsg}`);
    } finally {
      setIsCreatingIssue(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading item snapshot...</div>;
  if (!bug) return <div className="p-8 text-center text-red-500">Feedback ticket not found.</div>;
  if (submitted) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback Submitted</h2>
        <p className="text-gray-700 mb-4">Your feedback has been turned into a GitHub issue and marked as resolved.</p>
        <button
          onClick={() => router.push('/admin/feedback')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
        >
          Back to Feedback List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-lg shadow-md border">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Record</h1>
        <div className="flex items-center gap-2">
          {bug.isResolved ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-800">
              Resolved
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-yellow-100 text-yellow-800">
              Active
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${bug.type === 'bug' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
            {bug.type}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Title
          </h3>
          <div className="bg-gray-50 border rounded py-2 px-4 text-gray-800 truncate font-medium">
            {bug.title}
          </div>
        </div>

        {bug.type === 'bug' && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Issue Category</h3>
              <p className="text-gray-900 font-medium block bg-gray-50 p-2 rounded border">{bug.bugType}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Context URL</h3>
              {bug.bugUrl && bug.bugUrl !== 'N/A' ? (
                <a
                  href={bug.bugUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:underline break-all font-medium block bg-gray-50 p-2 rounded border"
                >
                  {bug.bugUrl}
                </a>
              ) : (
                <p className="text-gray-500 bg-gray-50 p-2 rounded border">N/A</p>
              )}
            </div>
          </>
        )}
        {bug.type === 'feature' && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Context URL</h3>
              {bug.featureContextUrl ? (
                <a
                  href={bug.featureContextUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:underline break-all font-medium block bg-gray-50 p-2 rounded border"
                >
                  {bug.featureContextUrl}
                </a>
              ) : (
                <p className="text-gray-500 bg-gray-50 p-2 rounded border">N/A</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Problem Description</h3>
              <p className="bg-gray-50 p-2 rounded border text-gray-800">{bug.featureProblem || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Alternatives Considered</h3>
              <p className="bg-gray-50 p-2 rounded border text-gray-800">{bug.featureAlternatives || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Proposed Solution</h3>
              <p className="bg-gray-50 p-2 rounded border text-gray-800">{bug.featureSolution || 'N/A'}</p>
            </div>
          </>
        )}

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {bug.type === 'bug' ? 'Detailed Description & Steps' : 'User Message'}
          </h3>
          {/* Content Report Container with native Markdown parser applied */}
          <div
            id="content-report-container"
            className="bg-gray-50 border rounded p-4 text-gray-800 min-h-[100px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(bug.message) }}
          />
        </div>

        {bug.attachedImage && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Attached Image</h3>
            <div className="bg-gray-50 border rounded p-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bug.attachedImage}
                alt="Attached Screenshot"
                className="max-h-96 object-contain rounded border shadow-sm"
              />
            </div>
          </div>
        )}

        <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
          <p><strong>Contact Email:</strong> {bug.email}</p>
          <p>
            <strong>Timestamp:</strong> {bug.createdAt?.seconds
              ? new Date(bug.createdAt.seconds * 1000).toLocaleString()
              : 'N/A'
            }
          </p>
        </div>

        {(bug.type === 'bug' || bug.type === 'feature') && !bug.isResolved && (
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleCreateGitHubIssue}
              disabled={isCreatingIssue}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md font-semibold text-sm hover:bg-yellow-700 transition duration-200 disabled:bg-gray-400 inline-flex items-center gap-2 shadow-sm"
            >
              {isCreatingIssue ? 'Creating GitHub Issue...' : 'Create GitHub Issue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
