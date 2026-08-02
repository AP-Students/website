import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env.js';

const PROJECT_ID = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

function parseFirestoreFields(doc: FirestoreDocument): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(doc.fields ?? {})) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
  }
  return result;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { feedbackId?: string } | null;
  const feedbackId = body?.feedbackId;
  if (!feedbackId || typeof feedbackId !== 'string' || feedbackId.includes('/')) {
    return NextResponse.json({ error: 'Invalid feedbackId' }, { status: 400 });
  }

  // Firestore's REST API enforces the same security rules as the client SDK when
  // given a user's ID token, so a successful read here proves isMemberOrAdmin().
  const firestoreDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/feedback/${encodeURIComponent(feedbackId)}`;
  const docRes = await fetch(firestoreDocUrl, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!docRes.ok) {
    return NextResponse.json({ error: 'Not authorized to access this feedback item' }, { status: 403 });
  }

  const bug = parseFirestoreFields((await docRes.json()) as FirestoreDocument);

  if (bug.type !== 'bug' && bug.type !== 'feature') {
    return NextResponse.json(
      { error: 'Only bug reports and feature requests can become GitHub issues' },
      { status: 400 },
    );
  }
  if (bug.isResolved) {
    return NextResponse.json({ error: 'This feedback item is already resolved' }, { status: 400 });
  }

  const gitHubAccessToken = env.GITHUB_ACCESS_TOKEN;
  const gitHubRepoOwner = env.GITHUB_REPO_OWNER;
  const gitHubRepoName = env.GITHUB_REPO_NAME;

  if (!gitHubAccessToken || !gitHubRepoOwner || !gitHubRepoName) {
    return NextResponse.json({ error: 'GitHub integration is not configured on the server' }, { status: 500 });
  }

  const imgMarkdown =
    typeof bug.attachedImage === 'string' && bug.attachedImage.startsWith('http')
      ? `\n\n[Attached Image](${bug.attachedImage})`
      : '';

  let issueBody = `### Feedback Context\n\n- **Type:** ${bug.type}\n- **Contact Email:** ${bug.email ?? 'anonymous'}\n`;
  if (bug.bugUrl && bug.bugUrl !== 'N/A') {
    issueBody += `- **Context URL:** ${bug.bugUrl}\n`;
  }
  if (bug.type === 'bug') {
    issueBody += `- **Category:** ${bug.bugType ?? 'N/A'}\n`;
    issueBody += `\n### Detailed Description & Steps to Reproduce\n\n${bug.message}\n${imgMarkdown}`;
  } else {
    issueBody += `\n### Feature Request Details\n`;
    if (bug.featureProblem) issueBody += `- **Problem:** ${bug.featureProblem}\n`;
    if (bug.featureAlternatives) issueBody += `- **Alternatives Considered:** ${bug.featureAlternatives}\n`;
    if (bug.featureSolution) issueBody += `- **Proposed Solution:** ${bug.featureSolution}\n`;
    issueBody += `\n### Additional Description\n\n${bug.message}\n${imgMarkdown}`;
  }

  const title =
    typeof bug.title === 'string' && bug.title.trim().length > 0
      ? bug.title
      : `${bug.type === 'bug' ? 'Bug' : 'Feature'}: ${typeof bug.bugType === 'string' ? bug.bugType : ''}`;

  const issueRes = await fetch(`https://api.github.com/repos/${gitHubRepoOwner}/${gitHubRepoName}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gitHubAccessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      title,
      body: issueBody.trim(),
      labels: [bug.type === 'bug' ? 'bug' : 'enhancement'],
    }),
  });

  if (!issueRes.ok) {
    const errorData = (await issueRes.json().catch(() => ({}))) as { message?: string };
    // 500, not 502/503/504: those "gateway" statuses get their response body replaced
    // by intermediary infrastructure (e.g. Cloudflare's own error page), hiding this message.
    return NextResponse.json(
      { error: errorData.message ?? `GitHub API responded with status ${issueRes.status}` },
      { status: 500 },
    );
  }

  const issue = (await issueRes.json()) as { html_url: string; number: number };

  // Same isMemberOrAdmin() rule already covers update, so this reuses the verified idToken.
  const patchRes = await fetch(`${firestoreDocUrl}?updateMask.fieldPaths=isResolved`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: { isResolved: { booleanValue: true } } }),
  });

  if (!patchRes.ok) {
    return NextResponse.json({
      issueUrl: issue.html_url,
      issueNumber: issue.number,
      warning: `GitHub issue created, but failed to mark feedback as resolved (status ${patchRes.status})`,
    });
  }

  return NextResponse.json({ issueUrl: issue.html_url, issueNumber: issue.number });
}
