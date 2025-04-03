import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import APLibrary from "@/components/landingPage/APLibrary";

const Page = () => {
  return (
    <div>
      <Navbar />

      <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            Library
          </h1>
          <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
            Comprehensive study guides and practice exams for every AP class.
          </p>
        </div>
        <APLibrary />
      </div>

      <Footer />
    </div>
  );
};
export default Page;
