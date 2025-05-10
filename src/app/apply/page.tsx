import { Accordion } from "@/components/ui/accordion";
import Navbar from "@/components/global/navbar";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Footer from "@/components/global/footer";
import FAQ from "@/components/landingPage/FAQ";
import { cn } from "@/lib/utils";
import { PencilRuler } from "lucide-react";

export default async function Home() {
  return (
    <>
      <Navbar />

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
    <div className="relative mt-8 grid place-content-center gap-5 overflow-clip rounded-lg border border-primary/50 bg-primary-foreground px-4 py-8 text-center shadow sm:p-12">
      <PencilRuler className="absolute -right-12 top-4 size-[250px] stroke-primary opacity-50" />
      <h2 className="z-10 text-4xl font-extrabold">Help us build FiveHive!</h2>
      <p className="z-10">
        A lot of content is still work in progress, and we could use your help!
      </p>
      <a
        href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s/edit?usp=sharing"
        className={cn(
          buttonVariants({ variant: "default" }),
          "z-10 mx-auto w-min text-lg",
        )}
      >
        Apply to FiveHive
      </a>
    </div>
  );
}
