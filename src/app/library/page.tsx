import Navbar from "@/app/components/ui/navbar";
import Footer from "@/app/components/ui/footer";
import APLibrary from "@/app/components/landingPage/APLibrary";

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
            Comprehensive guides and resources for every AP class.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          <APLibrary />
        </div>
      </div>

      <Footer />
    </div>
  );
};
export default Page;
