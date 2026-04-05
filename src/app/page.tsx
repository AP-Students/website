import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/global/navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Footer from "@/components/global/footer";
import SimpleAPLibrary from "@/components/landingPage/SimpleAPLibrary";
import FAQ from "@/components/landingPage/FAQ";

export default async function Home() {
  return (
    <>
      <Navbar className="bg-primary-foreground" />

      <main className="overflow-x-hidden">
        <Hero />
        <div className="mx-auto flex max-w-6xl flex-col px-6 pb-8 lg:px-8 ">
          <LibraryHeader />
          <SimpleAPLibrary />
          <SellingPoint />
          <div id="FAQ-section">
            <h2 className="mb-2 mt-12 text-center text-5xl font-bold">FAQ</h2>
            <p className="mb-10 text-center text-xl text-gray-700">
              Need help? We got you covered.
            </p>
            <Accordion
              type="single"
              collapsible
              className="mx-auto min-w-[10rem] max-w-[50rem] lg:w-[50rem]"
            >
              <FAQ />
            </Accordion>
          </div>
          <CallToAction />
        </div>

        <Footer />
      </main>
    </>
  );
}

function Hero() {
  return (
    <div className="grid place-content-center gap-4 border-b border-primary/50 bg-primary-foreground p-4 pt-0 text-center shadow sm:p-8 sm:pt-0 md:pb-20 md:pt-12">
      <Link
        href={"/peer-grading"}
        className="group mx-auto flex w-fit rounded-full border border-primary py-1 pl-4 pr-2 text-primary shadow-md shadow-primary/30 transition-all hover:translate-y-1 hover:shadow-none"
      >
        Try our <span className="ml-1 font-bold">Peer Grading Platform</span>
        <ChevronRight className="scale-75 transition-transform group-hover:translate-x-1" />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-center text-4xl font-extrabold md:text-5xl lg:text-6xl">
          By AP students. For AP students.
        </h1>
        <p className="text-balance text-lg leading-tight opacity-70 lg:text-xl">
          Free study guides, practice tests, and more for your AP classes
        </p>
      </div>
      <div className="mx-auto flex max-w-96 flex-wrap items-center justify-center gap-4 sm:max-w-max ">
        <div className="relative w-full sm:w-auto">
          <Link href="/library">
            <Button className="w-full py-6 text-base font-medium sm:w-auto sm:p-6">
              Start Studying for Free!
            </Button>
          </Link>

          <Image
            className="absolute -left-48 top-10 hidden md:block"
            alt="arrow"
            src={"/arrow.svg"}
            width={188}
            height={77}
          />
        </div>

        <Link
          className="w-full sm:w-auto"
          href="https://discord.com/invite/apstudents"
          target="_blank"
        >
          <Button className="w-full border border-[#5865F2] bg-transparent py-6 text-base font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2] hover:text-white sm:w-auto sm:p-6">
            Join the AP Discord
          </Button>
        </Link>
      </div>
    </div>
  );
}

function LibraryHeader() {
  return (
    <div className="flex flex-col justify-center">
      <h2 className="relative mx-auto mb-2 mt-20 inline-block text-center text-5xl font-bold leading-[1.2]">
        <span>
          <i>Everything</i> you need.
        </span>{" "}
        <span className="inline-block sm:block md:inline-block">
          For <u>free</u>.
        </span>
        <Image
          src="/star.svg"
          alt="Star"
          width={48}
          height={48}
          className="absolute -right-6 -top-6 hidden lg:block"
        />
        <Image
          src="/star.svg"
          alt="Star"
          width={16}
          height={16}
          className="absolute -right-9 -top-9 hidden rotate-45 lg:block "
        />
      </h2>
      <p className="mb-12 text-center text-xl leading-tight text-gray-700">
        Explore our resources for your AP class.
      </p>
    </div>
  );
}

function SellingPoint() {
  return (
    <div className="flex flex-wrap items-center justify-evenly gap-x-10 gap-y-36 px-16 py-32">
      <div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Built by the AP Community.
        </h1>
        <p className="mb-4 text-gray-700">
          Completely ran by student volunteers.
        </p>
        <ul className="mb-8 space-y-2">
          <li className="flex items-center">
            <svg
              className="mr-2 h-6 w-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            No corporations or &quot;non-profits&quot;
          </li>
          <li className="flex items-center">
            <svg
              className="mr-2 h-6 w-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Driven by student needs and feedback
          </li>
          <li className="flex items-center">
            <svg
              className="mr-2 h-6 w-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            100% free forever
          </li>
        </ul>
        <Link
          href="https://discord.com/invite/apstudents"
          target="_blank"
          className="w-fit rounded-full border border-[#5865F2] px-6 py-3 font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2] hover:text-white"
        >
          Join the AP Discord
        </Link>
      </div>
      <div className="relative">
        <iframe
          className="relative z-10 rounded-lg shadow-lg"
          src="https://discord.com/widget?id=181970867549503489&theme=dark"
          width="250"
          height="350"
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        ></iframe>

        <Image
          className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 scale-[2.5] transform"
          alt="Squiggle"
          src={"/squiggle.svg"}
          width={678}
          height={617}
        />
      </div>
    </div>
  );
}

function CallToAction() {
  return (
    <div className="relative mt-[6.75rem] grid place-content-center gap-5 overflow-clip rounded-lg border border-primary/50 bg-primary-foreground px-4 py-8 text-center font-bold shadow sm:p-12">
      <Image
        className="absolute -right-36 top-6 block scale-75 sm:-right-24 sm:-top-8 sm:scale-100"
        src="/diamond.svg"
        alt="Diamond"
        width={475}
        height={443}
      />
      <h2 className="z-10 text-balance text-4xl font-extrabold">
        Start your study sesh. Get that 5.
      </h2>
      <Link className="z-10 mx-auto w-fit" href="/library">
        <Button className="px-8 py-7 text-lg font-semibold">Study now!</Button>
      </Link>
    </div>
  );
}
