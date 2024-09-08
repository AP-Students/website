import dynamic from "next/dynamic";

const ArticleCreator = dynamic(() => import("./_components/ArticleCreator"), {
  ssr: false,
});

const Page = () => {
  return (
    <div className="min-h-screen px-12 py-4">
      {/* Probably replace the Article Creator text with the subject page title later (cant do until slugs are set up) */}
      <h1 className="px-8 pt-4 text-5xl font-bold">Article Creator</h1>
      <ArticleCreator className="mt-4 grow" />
    </div>
  );
};
export default Page;
