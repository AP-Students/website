import APsection from "./APsection";

const sectionData = [
  {
    title: "Math and Computer Science",
    numofCol: "lg:col-span-2",
    backgroundColor:
      "#4B71FC",
    courses: [
      "AP Calculus AB",
      "AP Calculus BC",
      "AP Precalculus",
      "AP Statistics",
      "AP Computer Science Principles",
      "AP Computer Science A",
    ],
  },
  {
    title: "English",
    numofCol: "lg:col-span-1",
    backgroundColor:
     "#FC5F5F",
    courses: ["AP English Language", "AP English Literature"],
  },
  {
    title: "Sciences",
    numofCol: "lg:col-span-3",
    backgroundColor:
    "#639D4E",
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
    backgroundColor:
     "#AC8449",
    courses: [
      "AP European History",
      "AP US History",
      "AP World History: Modern",
    ],
  },
  {
    title: "Social Sciences",
    numofCol: "lg:col-span-2",
    backgroundColor:
      "#178D8D",
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
    backgroundColor:
    "#6739D3",  
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
    backgroundColor:
      "#CB2EE5",
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
    backgroundColor:
    "#6DC6B9",
    courses: ["AP Research", "AP Seminar"],
  },
];

const APLibrary = () => {
  return (
    <>
      {sectionData.map((section) => (
        <APsection
          key={section.title}
          title={section.title}
          numofCol={section.numofCol}
          backgroundColor={section.backgroundColor}
          courses={section.courses}
        />
      ))}
    </>
  );
};

export default APLibrary;
