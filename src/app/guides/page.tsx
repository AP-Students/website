import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import APsection from "@/components/landingPage/APsection";

export default function Page() {
  return (
    <>
      <Navbar />

      <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            FAQ Docs
          </h1>
          <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
            Comprehensive guides and resources for every AP subject.
          </p>
        </div>
        <FAQLibrary />
      </div>

      <Footer />
    </>
  );
}

const sectionData = [
  {
    title: "Math and Computer Science",
    numofCol: "lg:col-span-2",
    borderColor: "#2563eb",
    courses: [
      "AP Calculus AB",
      "AP Calculus BC",
      "AP Precalculus",
      "AP Statistics | https://bit.ly/apstats-faq",
      "AP Computer Science Principles",
      "AP Computer Science A",
    ],
  },
  {
    title: "English",
    numofCol: "lg:col-span-1",
    borderColor: "#dc2626",
    courses: ["AP English Language", "AP English Literature"],
  },
  {
    title: "Sciences",
    numofCol: "lg:col-span-3",
    borderColor: "#16a34a",
    courses: [
      "AP Biology",
      "AP Chemistry",
      "AP Environmental Science",
      "AP Physics 1",
      "AP Physics 2",
      "AP Physics C: E&M",
      "AP Physics C: Mechanics",
    ],
  },
  {
    title: "History",
    numofCol: "lg:col-span-1",
    borderColor: "#9f1239",
    courses: [
      "AP European History",
      "AP US History",
      "AP World History: Modern",
    ],
  },
  {
    title: "Social Sciences",
    numofCol: "lg:col-span-2",
    borderColor: "#f97316",
    courses: [
      "AP Comparative Government",
      "AP Human Geography",
      "AP Macroeconomics",
      "AP Microeconomics",
      "AP United States Government",
      "AP Psychology",
    ],
  },
  {
    title: "World Languages and Cultures",
    numofCol: "lg:col-span-3",
    borderColor: "#a21caf",
    courses: [
      "AP Chinese",
      "AP French",
      "AP German",
      "AP Italian",
      "AP Japanese",
      "AP Latin",
      "AP Spanish Language",
      "AP Spanish Literature",
    ],
  },
  {
    title: "Arts",
    numofCol: "lg:col-span-2",
    borderColor: "#f59e0b",
    courses: [
      "AP 2-D Art and Design",
      "AP 3-D Art and Design",
      "AP Art History",
      "AP Drawing",
      "AP Music Theory",
    ],
  },
  {
    title: "AP Capstone",
    numofCol: "lg:col-span-1",
    borderColor: "#0891b2",
    courses: ["AP Research", "AP Seminar"],
  },
];

const FAQLibrary = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {sectionData.map((section) => (
        <APsection
          key={section.title}
          title={section.title + " Guides"}
          numofCol={section.numofCol}
          borderColor={section.borderColor}
          courses={section.courses}
          external
        />
      ))}
    </div>
  );
};
