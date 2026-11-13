/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function McpConnectionsPage() {
  const [connections, setConnections] = useState<Array<{ id: string; label?: string; allowedSubjectSlugs?: string[]; expiresAt?: string }>>([]);
  const [message, setMessage] = useState("Loading connections…");
  useEffect(() => { void (async () => { const user = auth.currentUser; if (!user) { setMessage("Sign in to manage connections."); return; } const response = await fetch("/api/mcp/v1/connections", { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }); const data = await response.json().catch(() => ({})); if (!response.ok) { setMessage(data?.error?.message ?? "Could not load connections."); return; } setConnections(data.connections ?? []); setMessage(""); })(); }, []);
  return <main className="mx-auto max-w-3xl space-y-5 p-8"><h1 className="text-3xl font-bold">MCP connections</h1>{message && <p>{message}</p>}<ul className="space-y-3">{connections.map((connection) => <li key={connection.id} className="rounded border p-4"><div className="font-semibold">{connection.label ?? "FiveHive MCP"}</div><div className="text-sm">Courses: {(connection.allowedSubjectSlugs ?? []).join(", ") || "all authorized courses"}</div><div className="text-sm">Expires: {connection.expiresAt ?? "unknown"}</div></li>)}</ul></main>;
}
