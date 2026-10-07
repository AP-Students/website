import { hasResponseText } from "./template.ts";

/**
 * Answers live in localStorage until they are submitted. A refresh, a closed
 * laptop, or a stray back-navigation used to lose the whole attempt, and there
 * is no server-side draft store to write to.
 */

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Whose draft a signed-out visitor's answers are saved as. Firebase uids are
 * 28-character random strings, so this cannot collide with a real account.
 */
export const GUEST_DRAFT_OWNER = "guest";

export const getDraftKey = (templateId: string, owner: string) =>
  `frq-draft:${templateId}:${owner}`;

export const readDraft = (
  storage: DraftStorage,
  draftKey: string,
): Record<string, string> => {
  try {
    const stored = storage.getItem(draftKey);

    if (!stored) {
      return {};
    }

    const parsed: unknown = JSON.parse(stored);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    // A corrupt or unreadable draft must not block the student from starting.
    return {};
  }
};

/**
 * Moves what a visitor wrote while signed out onto the account they just
 * signed in with, so having to sign in to submit never costs them the attempt.
 * A guest answer replaces the account's saved answer for the same part because
 * it is the newer work; a part the guest left blank keeps what the account
 * had. The guest copy is removed afterwards so it is only claimed once.
 */
export const claimGuestDraft = (
  storage: DraftStorage,
  templateId: string,
  uid: string,
) => {
  const guestKey = getDraftKey(templateId, GUEST_DRAFT_OWNER);
  const guestAnswers = Object.entries(readDraft(storage, guestKey)).filter(
    ([, response]) => hasResponseText(response),
  );

  try {
    if (guestAnswers.length > 0) {
      const userKey = getDraftKey(templateId, uid);

      storage.setItem(
        userKey,
        JSON.stringify({
          ...readDraft(storage, userKey),
          ...Object.fromEntries(guestAnswers),
        }),
      );
    }

    // Only reached once the answers are safely under the account, so a full
    // localStorage leaves the guest copy in place to be claimed next time.
    storage.removeItem(guestKey);
  } catch {
    // A full or disabled localStorage should not interrupt the attempt.
  }
};
