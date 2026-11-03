/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function McpImportPreviewPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Loading draft…");
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void (async () => {
        if (!user) {
          setMessage("Sign in to preview this private draft.");
          return;
        }
        const response = await fetch(`/api/mcp/v1/imports/${params.id}`, {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          setMessage(body?.error?.message ?? "Draft could not be loaded.");
          return;
        }
        if (body.import?.editorUrl) {
          window.location.assign(body.import.editorUrl);
          return;
        }
        setData(body.import);
        setMessage("");
      })();
    });
    return unsubscribe;
  }, [params.id]);
  if (message) return <main className="p-8"><p>{message}</p></main>;
  return <main className="mx-auto max-w-5xl space-y-5 p-8"><h1 className="text-3xl font-bold">Private MCP draft</h1><p>Type: {String(data?.contentType)} · State: {String(data?.state)}</p><pre className="max-h-[70vh] overflow-auto rounded bg-slate-100 p-4 text-sm">{JSON.stringify(data?.content, null, 2)}</pre></main>;
}
