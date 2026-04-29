"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/hooks/UserContext";
import {
  loadGuideSearchItems,
  searchGuideChapters,
  type GuideChapterSearchItem,
} from "@/lib/search/guideSearch";

const isPreviewUser = (access?: string) => access === "member" || access === "admin";

const SearchBar = ({
  className,
  mobile,
}: {
  className?: string;
  mobile?: boolean;
}) => {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<GuideChapterSearchItem[]>([]);
  const [results, setResults] = useState<GuideChapterSearchItem[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const listboxId = useId();

  const canPreview = isPreviewUser(user?.access);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;

    const loadItems = async () => {
      setLoadingIndex(true);
      try {
        const searchItems = await loadGuideSearchItems(canPreview);
        if (active) {
          setItems(searchItems);
        }
      } catch (error) {
        console.error("Failed to load guide search index", error);
      } finally {
        if (active) {
          setLoadingIndex(false);
        }
      }
    };

    loadItems().catch((error) => {
      console.error("Failed to initialize guide search", error);
      if (active) {
        setLoadingIndex(false);
      }
    });

    return () => {
      active = false;
    };
  }, [canPreview]);

  useEffect(() => {
    setSelectedIndex(-1);
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setResults(searchGuideChapters(items, debouncedQuery, 5));
  }, [debouncedQuery, items]);

  // Clamp selectedIndex when the results list shrinks (e.g. when items reload)
  useEffect(() => {
    setSelectedIndex((prev) => (prev >= results.length ? -1 : prev));
  }, [results]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setInputFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;
  const queryTooShort = hasQuery && query.trim().length < 2;
  const showDropdown = inputFocused && (hasQuery || loadingIndex);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsNavigating(false);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const beginNavigation = () => {
    setInputFocused(false);
    setIsNavigating(true);
  };

  const router = useRouter();

  const openSelectedResult = () => {
    const selectedResult = results[selectedIndex];

    if (selectedIndex < 0 || selectedIndex >= results.length || !selectedResult) {
      return;
    }

    beginNavigation();
    router.push(selectedResult.chapterPath);
  };

  const activeDescendant =
    selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
        <Input
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setInputFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((index) =>
                Math.min(index + 1, Math.max(results.length - 1, 0)),
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((index) => Math.max(index - 1, -1));
              return;
            }

            if (event.key === "Enter") {
              if (selectedIndex >= 0) {
                event.preventDefault();
                openSelectedResult();
              }
              return;
            }

            if (event.key === "Escape") {
              setInputFocused(false);
            }
          }}
          placeholder="Search Our Guides!"
          className={cn(
            "h-10 w-full rounded-full border-transparent bg-neutral-100/90 pl-9 pr-4 text-[0.95rem] shadow-inner ring-1 ring-black/10 transition-all placeholder:text-neutral-500/90 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/30",
            mobile && "h-11 bg-background text-base shadow-sm ring-border/60",
          )}
          aria-label="Search guides"
        />
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur"
        >
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur">
          {loadingIndex ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm opacity-70">
              <LoaderCircle className="size-4 animate-spin" />
              Loading guides...
            </div>
          ) : queryTooShort ? (
            <div className="px-2 py-3 text-sm opacity-70">
              Type at least 2 characters to search.
            </div>
          ) : hasResults ? (
            <div className="flex flex-col gap-1">
              {results.map((result, index) => (
                <Link
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  href={result.chapterPath}
                  key={`${result.chapterPath}-${index}`}
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                    selectedIndex === index && "bg-muted",
                  )}
                  onClick={beginNavigation}
                >
                  <p className="line-clamp-1 text-sm font-semibold">
                    {result.chapterTitle}
                  </p>
                  <p className="line-clamp-1 text-xs opacity-70">
                    {result.subjectTitle} / {result.unitTitle}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-2 py-3 text-sm opacity-70">
              No chapters found for &quot;{query.trim()}&quot;.
            </div>
          )}
        </div>
      )}

      {isNavigating && (
        <div className="fixed inset-0 z-[90] grid place-content-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border bg-background px-6 py-3 shadow-lg">
            <LoaderCircle className="size-5 animate-spin" />
            <p className="text-sm font-medium">Loading guide...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
