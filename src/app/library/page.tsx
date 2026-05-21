import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import APsection from "@/components/landingPage/APsection";
import APLibrary from "@/components/landingPage/APLibrary";

export default function Page() {
  return (
    <>
      <Navbar />

      <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            Library
          </h1>
          <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
            Comprehensive guides and resources for every AP subject.
          </p>
        </div>
        <APLibrary />
      </div>

      <Footer />
    </>
  );
}
