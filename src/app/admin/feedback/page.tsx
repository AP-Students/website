"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-floating-promises, @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function AdminFeedbackDashboard() {
  const router = useRouter();
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);

  const handleResolve = async (e: React.MouseEvent, itemId: string, item: any) => {
    e.stopPropagation();
    setArchivingIds(prev => [...prev, itemId]);
    try {
      const docRef = doc(db, 'feedback', itemId);
      const nextStatus = !item.isResolved;
      await updateDoc(docRef, { isResolved: nextStatus });

      setFeedbackItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, isResolved: nextStatus } : item
        )
      );
    }
    catch (error) {
      console.error("Error archiving item:", error);
    }
    finally {
      setArchivingIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const activeItems = feedbackItems.filter(item => !item.isResolved);
  const resolvedItems = feedbackItems.filter(item => item.isResolved);
  const displayedItems = activeTab === 'active' ? activeItems : resolvedItems;
  const [archivingIds, setArchivingIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeedbackItems(items);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading feedback...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        className={buttonVariants({ variant: "outline" })}
        href="/admin"
      >
        <ArrowLeft className="mr-2" />
        Return to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6 mt-6 text-gray-900">Feedback/Bug Reports</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'active'
            ? 'border-yellow-600 text-yellow-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Active Reports ({activeItems.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'resolved'
            ? 'border-yellow-600 text-yellow-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Resolved ({resolvedItems.length})
        </button>
      </div>
      {displayedItems.length === 0 ? (
        <p className="text-gray-500">
          {activeTab === 'active' ? 'No active feedback submissions found.' : 'No resolved submissions found yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Title</th>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {displayedItems.map((item) => (
                <tr key={item.id} onClick={() => router.push(`/admin/feedback/${item.id}`)} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${item.type === 'bug' ? 'bg-red-100 text-red-800' :
                      item.type === 'questions' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium max-w-xs truncate">
                    <Link href={`/admin/feedback/${item.id}`} className="text-yellow-600 hover:underline">
                      {item.title}
                      {item.type === 'bug' ? ` (${item.bugType})` : ''}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-500">{item.email}</td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">
                    {item.createdAt?.seconds
                      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                      : new Date().toLocaleDateString()
                    }
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleResolve(e, item.id, item)}
                      disabled={archivingIds.includes(item.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${item.isResolved
                        ? 'bg-green-100 hover:bg-green-200 text-green-800'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      {archivingIds.includes(item.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Updating...
                        </>
                      ) : item.isResolved ? (
                        "Unresolve"
                      ) : (
                        "Resolve"
                      )}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}