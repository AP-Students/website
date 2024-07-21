import Navbar from "@/components/ui/navbar";
import Link from "next/link";
import Footer from "@/components/ui/footer";

const Page = () => {
  return (
    <div>
      <Navbar />

      <div className="mx-auto flex max-w-6xl flex-col px-8 pb-8 ">
        <div className="mb-6 mt-12 flex flex-col gap-1">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            Library
          </h1>
          <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
            Comprehensive guides and resources for every AP class.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          <div
            className="col-span-3 rounded-lg p-10 text-white lg:col-span-2 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #8FA7FD 21.25%, #4B71FC 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">Math and CS</h3>
            <ul className="mt-5 columns-1 space-y-4 sm:columns-2">
              <li>
                <Link href="/subject/ap-calc-ab">AP Calculus AB</Link>
              </li>
              <li>
                <Link href="/">AP Calculus BC</Link>
              </li>
              <li>
                <Link href="/">AP Precalculus</Link>
              </li>
              <li>
                <Link href="/">AP Statistics</Link>
              </li>
              <li>
                <Link href="/">AP Computer Science Principles</Link>
              </li>
              <li>
                <Link href="/">AP Computer Science A</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg  p-10 text-white lg:col-span-1 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #FD8F8F 21.25%, #FC5F5F 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">English</h3>
            <ul className="mt-5 columns-1 space-y-4">
              <li>
                <Link href="/">AP English Language</Link>
              </li>
              <li>
                <Link href="/">AP English Literature</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg from-green-500 to-green-700 p-10 text-white lg:col-span-3 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #7EB56A 21.25%, #639D4E 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">Sciences</h3>
            <ul className="mt-5 space-y-4 sm:columns-2 md:columns-3">
              <li>
                <Link href="/">AP Biology</Link>
              </li>
              <li>
                <Link href="/">AP Chemistry</Link>
              </li>
              <li>
                <Link href="/">AP Environmental Science</Link>
              </li>
              <li>
                <Link href="/">AP Physics 1</Link>
              </li>
              <li>
                <Link href="/">AP Physics 2</Link>
              </li>
              <li>
                <Link href="/">AP Physics C: E&M</Link>
              </li>
              <li>
                <Link href="/">AP Physics C: Mechanics</Link>
              </li>
              <li>
                <Link href="/">AP Psychology</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg bg-amber-600 p-10 text-white lg:col-span-1 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #BF9C69 21.25%, #AC8449 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">History</h3>
            <ul className="mt-5 space-y-4">
              <li>
                <Link href="/">AP European History</Link>
              </li>
              <li>
                <Link href="/">AP US History</Link>
              </li>
              <li>
                <Link href="/">AP World History: Modern</Link>
              </li>{" "}
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg bg-yellow-600 p-10 text-white lg:col-span-2 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #D2DC5B 21.25%, #C6D331 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">Social Sciences</h3>
            <ul className="mt-5 space-y-4 sm:columns-2">
              <li>
                <Link href="/">AP Comparative Government</Link>
              </li>
              <li>
                <Link href="/">AP Human Geography</Link>
              </li>
              <li>
                <Link href="/">AP Macroeconomics</Link>
              </li>
              <li>
                <Link href="/">AP Microeconomics</Link>
              </li>
              <li>
                <Link href="/">AP United States Government</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg bg-amber-600 p-10 text-white lg:col-span-3 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #EDBD40 21.25%, #E5AC15 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">
              World Languages and Cultures
            </h3>
            <ul className="mt-5 space-y-4 sm:columns-2 md:columns-3">
              <li>
                <Link href="/">AP Chinese</Link>
              </li>
              <li>
                <Link href="/">AP French</Link>
              </li>
              <li>
                <Link href="/">AP German</Link>
              </li>
              <li>
                <Link href="/">AP Italian</Link>
              </li>
              <li>
                <Link href="/">AP Japanese</Link>
              </li>
              <li>
                <Link href="/">AP Latin</Link>
              </li>
              <li>
                <Link href="/">AP Spanish Language</Link>
              </li>
              <li>
                <Link href="/">AP Spanish Literature</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg p-10 text-white lg:col-span-2 lg:h-60 "
            style={{
              background:
                "linear-gradient(139.26deg, #D65CEB 21.25%, #CB2EE5 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">Arts</h3>
            <ul className="mt-5 columns-1 space-y-4 sm:columns-2">
              <li>
                <Link href="/">AP 2-D Art and Design</Link>
              </li>
              <li>
                <Link href="/">AP 3-D Art and Design</Link>
              </li>
              <li>
                <Link href="/">AP Art History</Link>
              </li>
              <li>
                <Link href="/">AP Drawing</Link>
              </li>
              <li>
                <Link href="/">AP Music Theory</Link>
              </li>
            </ul>
          </div>
          <div
            className="col-span-3 rounded-lg from-teal-400 to-teal-500 p-10 text-white lg:col-span-1 lg:h-60"
            style={{
              background:
                "linear-gradient(139.26deg, #9FD6CE 21.25%, #7BC7BC 90.93%)",
            }}
          >
            <h3 className="text-4xl font-bold text-white">AP Capstone</h3>
            <ul className="mt-5 space-y-4">
              <li>
                <Link href="/">AP Research</Link>
              </li>
              <li>
                <Link href="/">AP Seminar</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
export default Page;
