/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function McpConnectPage() {
  const [pairingId, setPairingId] = useState("");
  const [userCode, setUserCode] = useState("");
  const [courses, setCourses] = useState("");
  const [status, setStatus] = useState("Sign in, choose allowed course slugs, and approve.");

  useEffect(() => { const params = new URLSearchParams(window.location.search); setPairingId(params.get("pairingId") ?? ""); setUserCode(params.get("userCode") ?? ""); }, []);
  useEffect(() => { if (!pairingId) setStatus("The pairing link is missing its pairing ID."); }, [pairingId]);

  async function approve() {
    const current = auth.currentUser;
    if (!current || !pairingId) { setStatus("Sign in to FiveHive before approving this connection."); return; }
    setStatus("Approving…");
    const token = await current.getIdToken();
    const response = await fetch("/api/mcp/v1/pairings/approve", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ pairingId, subjectSlugs: courses.split(",").map((value) => value.trim()).filter(Boolean) }) });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Approved. Return to the MCP client and exchange the pairing." : (data?.error?.message ?? "Approval failed."));
  }

  return <main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-3xl font-bold">Connect a local FiveHive MCP</h1><p>Pairing code: <code>{userCode || "—"}</code></p><label className="block space-y-2"><span>Allowed course slugs (comma-separated)</span><input className="w-full rounded border p-2" value={courses} onChange={(event) => setCourses(event.target.value)} placeholder="porting" /></label><button className="rounded bg-black px-4 py-2 text-white" onClick={() => void approve()}>Approve connection</button><p role="status">{status}</p></main>;
}
