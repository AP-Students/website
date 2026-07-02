import "katex/dist/katex.min.css";
import { getSubject, getChapterContent } from "@/lib/sitemap-data";
import { renderEditorJsToHtml } from "@/components/article-creator/editorjs-render";
import QuestionsHydrator from "@/components/article-creator/QuestionsHydrator";
import ChapterScaffold from "./ChapterScaffold";
import ChapterClient from "./ChapterClient";
import type { OutputData } from "@editorjs/editorjs";

const CONTAINER_ID = "chapter-article";

type PageParams = { slug: string; unit: string; id: string; title: string };

/**
 * Chapter page. Public chapters (`isPublic === true`) are server-rendered so the
 * study-guide HTML and page-level JSON-LD reach crawlers and AI assistants in the
 * initial response. Gated chapters fall through to `ChapterClient`, which fetches
 * with the signed-in user's auth. If a public chapter's content can't be read
 * server-side (e.g. a transient REST failure), we also fall back to the client
 * renderer rather than showing nothing.
 */
export default async function Page({ params }: { params: PageParams }) {
  const subject = await getSubject(params.slug);
  const unitIndex = Number(params.unit.split("-")[1]) - 1;
  const unit = subject?.units[unitIndex];
  const chapterIndex =
    unit?.chapters.findIndex((ch) => ch.id === params.id) ?? -1;
  const chapter = chapterIndex >= 0 ? unit?.chapters[chapterIndex] : undefined;

  const clientFallback = (
    <ChapterClient
      params={{ slug: params.slug, unit: params.unit, id: params.id }}
    />
  );

  if (!subject || !unit || !chapter || chapter.isPublic !== true) {
    return clientFallback;
  }

  const content = await getChapterContent(params.slug, params.unit, params.id);
  if (!content) return clientFallback;

  return (
    <ChapterScaffold
      subjectTitle={subject.title}
      units={subject.units}
      unitIndex={unitIndex}
      chapterIndex={chapterIndex}
      unitTitle={unit.title}
      chapterTitle={chapter.title}
      chapterId={params.id}
      author={content.author}
    >
      <ChapterArticle data={content.data} />
    </ChapterScaffold>
  );
}

/** Server-rendered chapter body + client hydration of interactive question cards. */
function ChapterArticle({ data }: { data: OutputData }) {
  return (
    <>
      <article
        id={CONTAINER_ID}
        className="prose before:prose-code:content-none after:prose-code:content-none"
        dangerouslySetInnerHTML={{ __html: renderEditorJsToHtml(data) }}
      ></article>
      <QuestionsHydrator content={data} containerId={CONTAINER_ID} />
    </>
  );
}
