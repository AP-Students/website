import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function Home() {
  return (
    <>
      <main>
        <div className="grid h-96 place-content-center gap-4 bg-rose-50 p-8 text-center">
          <p className="mx-auto w-fit rounded-full border border-red-500 px-4 py-1 shadow-md shadow-red-500/50">
            Trusted by 10,000+ AP Students {">"}
          </p>
          <h1 className="text-3xl font-bold lg:text-5xl">
            By AP students. For AP students.
          </h1>
          <p className="text-xl text-gray-700">
            Access free study guides, practice tests, and more for your AP
            class.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/">
              <button className="rounded-full border border-red-600 bg-red-500 px-9 py-3 font-bold text-white">
                Start Studying for Free!
              </button>
            </Link>
            <a
              href="/"
              className="w-fit rounded-full border border-blue-500 px-6 py-3 font-medium text-blue-500 transition-colors hover:bg-blue-500 hover:text-white"
            >
              Join the AP Discord
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="mt-24 text-center text-5xl font-bold">
            Everything you need. For free.
          </h2>
          <p className="mb-12 text-center text-xl text-gray-700">
            Explore our resources for your AP class.
          </p>
          <div className="grid grid-cols-3 gap-4 lg:gap-8">
            <div
              className="col-span-3 rounded-lg p-10 text-white lg:col-span-2 lg:h-60"
              style={{
                background:
                  "linear-gradient(139.26deg, #8FA7FD 21.25%, #4B71FC 90.93%)",
              }}
            >
              <h3 className="text-4xl font-bold text-white">Math and CS</h3>
              <ul className="columns-2">
                <li>AP Calculus AB</li>
                <li>AP Calculus BC</li>
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
              <ul className="columns-2">
                <li>AP English Language</li>
                <li>AP English Literature</li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
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
              <ul className="columns-2">
                <li></li>
                <li></li>
              </ul>
            </div>
          </div>
          <div className="flex space-x-8 rounded-lg bg-white px-16 py-32">
            <div className="flex-1">
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
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  No corporations or "non-profits"
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
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
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
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  100% free forever
                </li>
              </ul>
              <a
                href="/"
                className="w-fit rounded-full border border-blue-500 px-6 py-3 font-medium text-blue-500 transition-colors hover:bg-blue-500 hover:text-white"
              >
                Join the AP Discord
              </a>
            </div>
            <div className="h-auto w-60">
              <img
                src="/discord.png"
                alt="Discord Screenshot"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-2xl font-bold">
                What types of resources do you offer for AP students?
              </AccordionTrigger>
              <AccordionContent>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                Corrupti cupiditate repellendus ea perferendis error cumque
                tempore impedit aperiam architecto dolorum similique numquam
                nobis quisquam harum corporis itaque quibusdam, laudantium
                tenetur laborum ipsum. Nobis hic veritatis nisi ducimus atque
                repellat harum!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-2xl font-bold">
                Who creates the resources?
              </AccordionTrigger>
              <AccordionContent>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                Corrupti cupiditate repellendus ea perferendis error cumque
                tempore impedit aperiam architecto dolorum similique numquam
                nobis quisquam harum corporis itaque quibusdam, laudantium
                tenetur laborum ipsum. Nobis hic veritatis nisi ducimus atque
                repellat harum!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-2xl font-bold">
                How can I contribute?
              </AccordionTrigger>
              <AccordionContent>
                We welcome contributions from AP students like you! Whether you
                have study notes, practice exams, or helpful tips to share, you
                can submit your content to be reviewed and added to our resource
                library. Join us in building a community-driven platform for AP
                exam preparation.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-8 grid place-content-center gap-5 rounded-lg bg-red-50 p-12 text-center font-bold">
            <h2 className="text-4xl">Start your study sesh. Get that 5.</h2>
            <Link href="/">
              <button className="rounded-full bg-red-500 px-9 py-3 font-bold text-white">
                Study now!
              </button>
            </Link>
          </div>
        </div>
        <div className="mx-8 max-w-5xl bg-red-200"></div>
      </main>
    </>
  );
}
