/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-floating-promises, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export default function FeedbackPage() {
  const [featureProblem, setFeatureProblem] = useState('');
  const [featureAlternatives, setFeatureAlternatives] = useState('');
  const [featureSolution, setFeatureSolution] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState('general');
  // New bug-specific states matching your images
  const [bugType, setBugType] = useState('Website Article Errors');
  const [bugUrl, setBugUrl] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [featureContextUrl, setFeatureContextUrl] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
    } else {
      setAttachedImage(null);
    }
  };

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const trimmedBugUrl = bugUrl.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setStatus('error');
      return;
    }

    if (type === 'bug' && !trimmedBugUrl) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      interface NewFeedback {
        type: string;
        message: string;
        title: string;
        email: string;
        // Firestore server timestamp field
        createdAt: Timestamp;
        bugType?: string;
        bugUrl?: string;
        attachedImage?: string;
        // Feature request fields
        featureProblem?: string;
        featureAlternatives?: string;
        featureSolution?: string;
        featureContextUrl?: string;
      }

      // Build the base payload
      const feedbackPayload: NewFeedback = {
        type,
        message: trimmedMessage,
        title: trimmedTitle,
        email: email || 'anonymous',
        createdAt: serverTimestamp() as Timestamp,
      };

      // Conditionally append the precise details if it's a bug report
      if (type === 'bug') {
        feedbackPayload.bugType = bugType;
        feedbackPayload.bugUrl = trimmedBugUrl;
      }
      // Add feature request specific fields
      if (type === 'feature') {
        feedbackPayload.featureProblem = featureProblem;
        feedbackPayload.featureAlternatives = featureAlternatives;
        feedbackPayload.featureSolution = featureSolution;
        feedbackPayload.featureContextUrl = featureContextUrl;
      }

      // If an image was attached, upload it to Firebase Storage first
      if (attachedImage && type !== 'general') {
        const imageRef = ref(
          storage,
          `feedbackImages/${Date.now()}-${attachedImage.name}`
        );
        await uploadBytes(imageRef, attachedImage);
        feedbackPayload.attachedImage = await getDownloadURL(imageRef);
      }

      // Add feedback document with image URL (if any) included
      const docRef = await addDoc(collection(db, 'feedback'), feedbackPayload);
      // Mark as submitted so UI shows success view
      setSubmitted(true);
      setStatus('success');
      console.log('Feedback document created with ID:', docRef.id);

      // Clear form fields
      setMessage('');
      setEmail('');
      setTitle('');
      setBugUrl('');
      setAttachedImage(null);
      setFeatureProblem('');
      setFeatureAlternatives('');
      setFeatureSolution('');
      // Reset file input if present
      const fileInput = document.getElementById('screenshot-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setStatus('error');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback Submitted</h2>
        <p className="text-gray-700 mb-4">Thank you! Your feedback has been recorded.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStatus('idle');
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
        >
          Submit Another Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md border">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Submit Feedback</h1>

      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Thank you! Your feedback has been submitted successfully.
        </div>
      )}
      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            required
            placeholder="title of issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
          </select>
        </div>

        {/* --- DYNAMIC BUG FIELDS (Shown only when 'bug' is chosen) --- */}
        {type === 'bug' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What is the type of the issue? *
              </label>
              <select
                value={bugType}
                onChange={(e) => setBugType(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              >
                <option value="Website Article Errors">Website Article Errors</option>
                <option value="Unit Test Errors">Unit Test Errors</option>
                <option value="Mock Exam Errors">Mock Exam Errors</option>
                <option value="Website Bugs">Website Bugs</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What is the URL of the issue? *
              </label>
              <p className="text-xs text-gray-500 mb-1">If the URL is irrelevant for your bug report, just put down &quot;N/A&quot;.</p>
              <input
                type="text"
                required
                placeholder="https://fivehive.org/... or N/A"
                value={bugUrl}
                onChange={(e) => setBugUrl(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Screenshot (Optional)
              </label>
              <input
                id="screenshot-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              />
            </div>
          </>
        )}
        {/* ------------------------------------------------------------- */}

        {/* Feature Request Fields (shown when type === 'feature') */}
        {type === 'feature' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Context URL</label>
              <input
                type="text"
                placeholder="https://example.com/..."
                value={featureContextUrl}
                onChange={e => setFeatureContextUrl(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Is your feature request related to a problem? Please describe.</label>
              <textarea
                rows={3}
                value={featureProblem}
                onChange={e => setFeatureProblem(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe alternatives you've considered</label>
              <textarea
                rows={3}
                value={featureAlternatives}
                onChange={e => setFeatureAlternatives(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the solution you'd like (rich text)</label>
              <textarea
                rows={4}
                value={featureSolution}
                onChange={e => setFeatureSolution(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Screenshot (Optional)</label>
              <input
                id="screenshot-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded-md bg-gray-50 text-gray-900 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              />
            </div>
          </>
        )}

        {/* ------------------------------------------------------------- */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (Optional)</label>
          <input
            type="email"
            placeholder="apstudent@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'bug' ? 'Please describe the issue in detail. *' : 'Message *'}
          </label>
          {type === 'bug' && (
            <p className="text-xs text-gray-500 mb-1">
              Please include any relevant information, such as factual errors, punctuation errors, broken links, formatting issues, appearance bugs, ... Most importantly, please provide detailed steps on how to reproduce this bug.
            </p>
          )}
          <textarea
            required
            rows={4}
            placeholder={type === 'bug' ? "Steps to reproduce / description..." : "This could be anything about improving the website or even FiveHive in general! We appreciate any feedback you can give."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-md transition duration-200"
        >
          {status === 'loading' ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
