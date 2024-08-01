import dynamic from "next/dynamic";

const ArticleCreator = dynamic(() => import("./_components/ArticleCreator"), {
  ssr: false,
});

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col px-12 py-4">
      <h1 className="px-4 text-5xl font-black">Article Creator</h1>
      <ArticleCreator className="mt-4 grow" />
    </div>
  );
};
export default Page;
