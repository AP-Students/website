import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./_components/Editor"), {
  ssr: false,
});

const Page = () => {
  return <Editor />;
};
export default Page;
