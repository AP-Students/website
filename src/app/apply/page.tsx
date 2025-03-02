import { Accordion } from "@/components/ui/accordion";
import Navbar from "@/components/global/navbar";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Footer from "@/components/global/footer";
import FAQ from "@/components/landingPage/FAQ";
import { cn } from "@/lib/utils";

export default async function Home() {
  return (
    <>
      <Navbar className="bg-primary-foreground" />

      <main className="flex min-h-[calc(100vh-120px)] flex-col overflow-x-hidden">
        <div className="mx-auto flex max-w-6xl flex-col px-6 pb-8 lg:px-8 ">
          <CallToAction />
          <div id="FAQ-section">
            <h2 className="mb-2 mt-12 text-center text-5xl font-bold">FAQ</h2>
            <Accordion
              type="single"
              collapsible
              className="mx-auto min-w-[10rem] max-w-[50rem] lg:w-[50rem]"
            >
              <FAQ />
            </Accordion>
          </div>
        </div>

        <Footer className="mt-auto w-full" />
      </main>
    </>
  );
}

function CallToAction() {
  return (
    <div className="relative mt-8 grid place-content-center gap-5 overflow-clip rounded-lg bg-primary-foreground px-4 py-8 text-center sm:p-12">
      <Image
        className="absolute -right-36 top-6 block scale-75 sm:-right-24 sm:-top-8 sm:scale-100"
        src="/diamond.svg"
        alt="Diamond"
        width={475}
        height={443}
      />
      <h2 className="z-10 text-4xl font-extrabold">Help us build FiveHive!</h2>
      <p className="z-10">
        A lot of content is still work in progress, and we could use your help!
      </p>
      <a
        href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s/edit?usp=sharing"
        className={cn(
          buttonVariants({ variant: "default" }),
          "z-10 mx-auto w-min",
        )}
      >
        Apply to FiveHive
      </a>
    </div>
  );
}
