import SimpleAPSection from "./SimpleAPSection";

const sectionData = [
  {
    title: "Math and Computer Science",
    numofCol: "lg:col-span-2",
    borderColor: "#2563eb",
    courses: [
      {title: "AP Calculus AB", url:"/subject/calculus-ab"},
      {title: "AP Calculus BC", url:"/subject/calculus-bc"},
      {title: "AP Precalculus", url:"/subject/precalculus"},
      {title: "AP Statistics", url:"/subject/statistics"},
      {title: "AP Computer Science Principles", url:"/subject/computer-science-principles"},
      {title: "AP Computer Science A", url:"/subject/computer-science-a"},
    ],
  },
  {
    title: "English",
    numofCol: "lg:col-span-1",
    borderColor: "#dc2626",
    courses: [
      {title: "AP English Language", url:"/subject/english-language"},
      {title: "AP English Literature", url:"/subject/english-literature"},
    ],
  },
  {
    title: "Sciences",
    numofCol: "lg:col-span-3",
    borderColor: "#16a34a",
    courses: [
      {title: "AP Biology", url:"/subject/biology"},
      {title: "AP Chemistry", url:"/subject/chemistry"},
      {title: "AP Environmental Science", url:"/subject/environmental-science"},
      {title: "AP Physics 1", url:"/subject/physics-1"},
      {title: "AP Physics 2", url:"/subject/physics-2"},
      {title: "AP Physics C: E&M", url:"/subject/physics-c-em"},
      {title: "AP Physics C: Mechanics", url:"/subject/physics-c-mechanics"}
    ],
  },
  {
    title: "History",
    numofCol: "lg:col-span-1",
    borderColor: "#9f1239",
    courses: [
      {title: "AP European History", url:"/subject/european-history"},
      {title: "AP US History", url:"/subject/us-history"},
      {title: "AP World History: Modern", url:"/subject/world-history-modern"}
    ],
  },
  {
    title: "Social Sciences",
    numofCol: "lg:col-span-2",
    borderColor: "#f97316",
    courses: [
      {title: "AP Comparative Government", url:"/subject/comparative-government"},
      {title: "AP Human Geography", url:"/subject/human-geography"},
      {title: "AP Macroeconomics", url:"/subject/macroeconomics"},
      {title: "AP Microeconomics", url:"/subject/microeconomics"},
      {title: "AP United States Government", url:"/subject/united-states-government"},
      {title: "AP Psychology", url:"/subject/psycology"},
      {title: "AP African American Studies", url:"/subject/african-american-studies"}
    ],
  },
  {
    title: "World Languages and Cultures",
    numofCol: "lg:col-span-3",
    borderColor: "#a21caf",
    courses: [
      {title: "AP Chinese", url:"/subject/chinese"},
      {title: "AP French", url:"/subject/french"},
      {title: "AP German", url:"/subject/german"},
      {title: "AP Italian", url:"/subject/italian"},
      {title: "AP Japanese", url:"/subject/japanese"},
      {title: "AP Latin", url:"/subject/latin"},
      {title: "AP Spanish Language", url:"/subject/spanish-language"},
      {title: "AP Spanish Literature", url:"/subject/spanish-literature"}
    ],
  },
  {
    title: "Arts",
    numofCol: "lg:col-span-2",
    borderColor: "#f59e0b",
    courses: [
      {title: "AP 2-D Art and Design", url:"/subject/2d-art-and-design"},
      {title: "AP 3-D Art and Design", url:"/subject/3d-art-and-design"},
      {title: "AP Art History", url:"/subject/art-history"},
      {title: "AP Drawing", url:"/subject/drawing"},
      {title: "AP Music Theory", url:"/subject/music-theory"}
    ],
  },
  {
    title: "AP Capstone",
    numofCol: "lg:col-span-1",
    borderColor: "#0891b2",
    courses: [
      {title: "AP Research", url:"/subject/research"},
      {title: "AP Seminar", url:"/subject/seminar"}
    ],
  },
];

const APLibrary = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {sectionData.map((section) => (
        <SimpleAPSection
          key={section.title}
          title={section.title}
          numofCol={section.numofCol}
          borderColor={section.borderColor}
          courses={section.courses}
        />
      ))}
    </div>
  );
};

export default APLibrary;
