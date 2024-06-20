import cn from "classnames";
import NextLink from "next/link";
import Header from "@/app/components/Layout/Header";
import FAQItem from "./components/FAQ";

function Section({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <div
      className={"flex w-full flex-col px-5"}
      style={{
        contain: "content",
      }}
    >
      <div className="my-20 flex w-full grow flex-col items-center gap-2 px-5 lg:my-32">
        {children}
      </div>
    </div>
  );
}

function Title({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <h2 className="leading-xl font-display -mt-4 mb-7 w-full max-w-3xl text-center text-4xl font-semibold text-primary lg:max-w-4xl lg:text-5xl dark:text-primary-dark">
      {children}
    </h2>
  );
}

function Subtitle({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <h3 className="mx-auto max-w-3xl text-lg font-semibold leading-normal text-slate-800 lg:text-3xl dark:text-slate-200">
      {children}
    </h3>
  );
}

function Center({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <div className="flex max-w-4xl flex-col items-center justify-center px-5 text-white text-opacity-80 lg:px-0 lg:text-center">
      {children}
    </div>
  );
}

interface ButtonProps {
  href: string;
  type?: "primary" | "secondary";
}

function Button({
  href,
  className,
  children,
  type,
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonProps) {
  const classes = cn(
    className,
    "p-5 px-10 text-3xl font-bold border-2 bg-white dark:bg-zinc-950 border-primary dark:border-primary-dark rounded-md",
    {
      "shadow-button": type === "primary",
    },
  );

  if (href.startsWith("https://")) {
    <a href={href as string} className={classes}>
      {children}
    </a>;
  }

  return (
    <NextLink href={href as string} className={classes}>
      {children}
    </NextLink>
  );
}

interface APCommunityCardProp {
  number: string;
  description: string;
}

function APCommunityCard({ number, description }: APCommunityCardProp) {
  return (
    <div className="mx-6 flex-col items-center text-center ">
      <div className="font-display -mt-4 mb-2 w-full max-w-3xl text-4xl font-semibold text-primary sm:mb-4 lg:mb-7 lg:max-w-4xl lg:text-5xl dark:text-primary-dark">
        {/* Probably pull from database here for auto-updates but for now Ill hard code it*/}
        {number}
      </div>
      <div className="max-w-3xl text-lg font-semibold text-slate-800 lg:text-3xl dark:text-slate-200">
        {description}
      </div>
    </div>
  );
}

export default async function Home() {
  return (
    <>
      <Header />
      <main className="isolate min-w-0">
        <div className="break-words font-normal text-primary dark:text-primary-dark">
          <div className="flex flex-col justify-center bg-slate-50 px-5 pb-20 pt-12 lg:pb-32 lg:pt-24 dark:bg-zinc-900">
            <h1 className="font-display flex max-w-3xl self-center text-center text-5xl font-bold leading-snug text-primary lg:text-6xl lg:leading-snug dark:text-primary-dark">
              Made by AP students.
              <br />
              For AP students.
            </h1>
            <h3 className="font-display mt-5 flex max-w-2xl self-center text-center text-2xl leading-snug text-slate-800 lg:text-3xl lg:leading-snug dark:text-slate-200">
              Access curated study guides, practice tests, and more for your AP
              classes.
            </h3>
            <div className="relative mt-14 flex flex-col items-center">
              {/* Arrow for emphasizing the study now button */}
              <svg
                className="absolute -top-10 bottom-0 hidden -translate-x-96 translate-y-full transform lg:block"
                width="188"
                height="77"
                viewBox="0 0 188 77"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.89553 63.864C3.08746 63.636 3.02613 62.8315 3.28131 62.4528C4.58708 60.5151 5.90383 58.5888 7.36509 56.7627C12.0123 50.9552 17.7185 46.3466 23.8957 42.2262C33.8472 35.5883 44.2649 29.4801 55.383 25.0177C65.0563 21.1352 76.7137 17.332 87.262 19.2782C92.4056 20.2272 101.437 23.2784 102.51 29.3877C103.798 36.7249 96.3426 44.7414 91.7876 49.5242C83.9604 57.7429 73.1834 64.4522 62.844 68.9947C56.2218 71.9042 45.7326 76.4139 38.7055 72.146C32.501 68.3776 36.9205 60.7779 40.2672 56.4686C48.3739 46.0302 59.9231 38.5869 71.4187 32.3452C84.9803 24.9817 100.056 19.1113 115.637 18.4578C122.721 18.1606 134.3 18.169 138.841 25.0017C143.167 31.5098 136.783 39.7469 132.639 44.4118C126.351 51.491 117.548 57.22 109.171 61.5427C108.036 62.1286 99.5708 66.4782 99.7656 62.2004C100.034 56.309 106.998 49.7881 110.571 45.7932C119.066 36.2948 130.621 29.7469 141.507 23.3854C148.58 19.2521 155.74 15.256 163.361 12.2041C164.461 11.7632 167.926 9.82957 169.118 10.9795C171.121 12.912 157.907 17.6943 157.109 17.9923C156.572 18.1926 152.363 19.9904 152.284 18.3815C152.226 17.2258 152.803 16.0806 152.754 14.894C152.443 7.38287 142.069 6.34954 136.693 5.13719C136.384 5.06757 132.953 4.13167 133.531 3.49217C134.985 1.88425 141.514 3.17001 143.271 3.21769C152.186 3.45958 161.114 3.53944 170.032 3.65553C173.48 3.70042 176.935 3.60381 180.375 3.89605C181.626 4.0023 184.076 4.01706 184.976 5.118C186.557 7.05033 176.033 14.5678 174.867 15.4967C170.214 19.2044 165.308 22.5759 161.454 27.1532"
                  stroke="#1E1E1E"
                  stroke-width="4.9555"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <Button
                  href={"/guides"}
                  type="primary"
                  className="justify-center"
                >
                  Study Now
                </Button>
                <Button
                  href={"https://discord.com/invite/apstudents"}
                  type="primary"
                  className="justify-center"
                >
                  Join the Discord
                </Button>
              </div>
            </div>
          </div>

          <Section>
            <Center>
              <Title>Everything all in one place. For free.</Title>
              <Subtitle>Explore our resources for your AP class.</Subtitle>
            </Center>
            <Button
              href={"/guides"}
              type="primary"
              className="wautol  mt-10 justify-center self-center"
            >
              View All
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>How it works.</Title>
              <Subtitle>Learn about all of our features.</Subtitle>
            </Center>
            <Button
              href={"/guides"}
              type="secondary"
              className="mt-10 w-auto justify-center self-center"
            >
              Start Studying!
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>Built by the AP community.</Title>
              <Subtitle>
                Completely ran by student volunteers.
                <br />
                No corporations or “non-profits” involved.
              </Subtitle>
            </Center>
            <div className="mt-12 flex justify-center">
              <APCommunityCard number="26" description="Developers" />
              <APCommunityCard number="54" description="Content Contributers" />
              <APCommunityCard number="36" description="Outreach Team" />
            </div>

            <Button
              href={"https://discord.com/invite/apstudents"}
              type="secondary"
              className="mt-10 w-auto justify-center text-center"
            >
              Join us!
            </Button>
          </Section>

          <Section>
            <Center>
              <Title>FAQ</Title>
            </Center>
            <FAQItem
                question="What is Lorem Ipsum?"
                answer="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
              />
            <FAQItem
                question="What is Lorem Ipsum?"
                answer="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
              />
            <FAQItem
                question="What is Lorem Ipsum?"
                answer="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
              />
            <FAQItem
                question="What is Lorem Ipsum?"
                answer="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
              />
          </Section>
        </div>
      </main>
    </>
  );
}
