"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchUsernames,
  useFriends,
  type FriendRow,
} from "@/components/hooks/useFriends";
import {
  sendFriendRequest,
  setUsername,
  updateFriend,
  type FriendAction,
} from "@/lib/friends";
import {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  usernameProblem,
} from "@/lib/username";

const at = (username: string | null) =>
  username ? `@${username}` : "Deleted account";

function List({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <ul className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
        {children}
      </ul>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex items-center gap-2 px-4 py-3">{children}</li>;
}

function UsernameForm({ username }: { username?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(username ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputId = useId();

  if (username && !editing) {
    return (
      <p>
        Your username is <strong>@{username}</strong>.{" "}
        <Button
          variant="link"
          className="h-auto p-0"
          onClick={() => {
            setValue(username);
            setEditing(true);
          }}
        >
          Change
        </Button>
      </p>
    );
  }

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const name = normalizeUsername(value);
    const error = usernameProblem(name);
    setProblem(error);
    if (error) return;
    setSaving(true);
    try {
      await setUsername(name);
      toast.success(`Your username is now @${name}.`);
      setEditing(false);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-semibold">
        {username ? "New username" : "Pick a username so friends can find you"}
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={USERNAME_MAX_LENGTH + 1}
          placeholder="e.g. sam_lee"
          autoComplete="off"
          aria-invalid={problem ? true : undefined}
          aria-describedby={`${inputId}-hint`}
        />
        <Button type="submit" disabled={saving}>
          Save
        </Button>
        {username && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        )}
      </div>
      <p
        id={`${inputId}-hint`}
        className={problem ? "text-sm text-red-700" : "text-sm text-gray-600"}
      >
        {problem ??
          "3 to 20 letters, numbers or underscores, starting with a letter. Anyone signed in can search for it."}
      </p>
    </form>
  );
}

export default function FriendsPanel({
  uid,
  username,
}: {
  uid: string;
  username?: string;
}) {
  const { friends, incoming, outgoing, error } = useFriends(uid);
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] =
    useState<Array<{ uid: string; username: string }>>();
  const searchId = useId();

  const prefix = normalizeUsername(search);
  useEffect(() => {
    if (prefix.length < 2) {
      setResults(undefined);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsernames(prefix)
        .then((found) => {
          if (!cancelled) setResults(found);
        })
        .catch((err) => {
          console.error("Error searching usernames:", err);
          if (!cancelled) setResults([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prefix]);

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    try {
      await task();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };
  const update = (action: FriendAction, row: FriendRow, message?: string) =>
    run(`${action}:${row.uid}`, async () => {
      await updateFriend(action, row.uid);
      if (message) toast.success(message);
    });
  const add = (name: string) =>
    run(`request:${name}`, async () => {
      const status = await sendFriendRequest(name);
      toast.success(
        status === "friends"
          ? `You and @${name} are now friends.`
          : `Friend request sent to @${name}.`,
      );
    });

  const isFriend = (id: string) => friends?.some((row) => row.uid === id);
  const sentTo = (id: string) => outgoing?.some((row) => row.uid === id);
  const from = (id: string) => incoming?.find((row) => row.uid === id);

  return (
    <section
      aria-labelledby="friends-title"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
    >
      <h2 id="friends-title" className="text-2xl font-bold">
        Friends
      </h2>
      <UsernameForm username={username} />

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
          Couldn&apos;t load your friends. Refresh to try again.
        </p>
      )}

      {username && (
        <div className="flex flex-col gap-2">
          <label htmlFor={searchId} className="font-semibold">
            Find friends by username
          </label>
          <Input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="@username"
            autoComplete="off"
          />
          {results?.length === 0 && (
            <p className="text-sm text-gray-600">
              No usernames start with &quot;{prefix}&quot;.
            </p>
          )}
          {results && results.length > 0 && (
            <ul
              aria-label="Search results"
              className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
            >
              {results.map((result) => {
                const request = from(result.uid);
                return (
                  <Row key={result.uid}>
                    <span className="min-w-0 flex-1 truncate">
                      @{result.username}
                    </span>
                    {result.uid === uid ? (
                      <span className="text-sm text-gray-500">You</span>
                    ) : isFriend(result.uid) ? (
                      <span className="text-sm text-gray-500">Friends</span>
                    ) : sentTo(result.uid) ? (
                      <span className="text-sm text-gray-500">Requested</span>
                    ) : request ? (
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          void update(
                            "accept",
                            request,
                            `You and @${result.username} are now friends.`,
                          )
                        }
                      >
                        Accept
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => void add(result.username)}
                      >
                        Add friend
                      </Button>
                    )}
                  </Row>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {incoming && incoming.length > 0 && (
        <List title={`Friend requests (${incoming.length})`}>
          {incoming.map((row) => (
            <Row key={row.uid}>
              <span className="min-w-0 flex-1 truncate">
                <strong>{at(row.username)}</strong> wants to be friends
              </span>
              <Button
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void update(
                    "accept",
                    row,
                    `You and ${at(row.username)} are now friends.`,
                  )
                }
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void update("decline", row)}
              >
                Decline
              </Button>
            </Row>
          ))}
        </List>
      )}

      {outgoing && outgoing.length > 0 && (
        <List title="Sent requests">
          {outgoing.map((row) => (
            <Row key={row.uid}>
              <span className="min-w-0 flex-1 truncate">
                {at(row.username)}{" "}
                <span className="text-sm text-gray-500">
                  hasn&apos;t answered yet
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void update("cancel", row)}
              >
                Cancel
              </Button>
            </Row>
          ))}
        </List>
      )}

      {friends === undefined && !error ? (
        <p role="status" className="text-gray-500">
          Loading your friends…
        </p>
      ) : friends && friends.length === 0 ? (
        <p className="text-gray-600">
          No friends yet.{" "}
          {username
            ? "Search for a username above to add someone."
            : "Pick a username first, then you can add friends."}
        </p>
      ) : (
        friends && (
          <List title={`Your friends (${friends.length})`}>
            {friends.map((row) => (
              <Row key={row.uid}>
                <Link
                  href={`/profile/${row.uid}`}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {at(row.username)}
                </Link>
                {removing === row.uid ? (
                  <>
                    <span className="text-sm">Remove?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy !== null}
                      onClick={() => {
                        setRemoving(null);
                        void update(
                          "remove",
                          row,
                          `Removed ${at(row.username)} from your friends.`,
                        );
                      }}
                    >
                      Yes, remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRemoving(null)}
                    >
                      Keep
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => setRemoving(row.uid)}
                  >
                    Remove
                  </Button>
                )}
              </Row>
            ))}
          </List>
        )
      )}
    </section>
  );
}
