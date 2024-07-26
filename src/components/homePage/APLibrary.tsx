import APsection from "./APsection";

const sectionData = [
  {
    title: "Math and Computer Science",
    numofCol: "lg:col-span-2",
    backgroundColor:
      "linear-gradient(139.26deg, #2449CF 21.25%, #4B71FC 90.93%)",
    courses: [
      "AP Calculus AB",
      "AP Calculus BC",
      "AP Precalculus",
      "AP Statistics",
      "AP Computer Science Principles",
      "AP Computer Science Applications",
    ],
  },
  {
    title: "English",
    numofCol: "lg:col-span-1",
    backgroundColor:
      "linear-gradient(139.26deg, #AE2020 21.25%, #FC5F5F 90.93%)",
    courses: ["AP English Language", "AP English Literature"],
  },
  {
    title: "Sciences",
    numofCol: "lg:col-span-3",
    backgroundColor:
      "linear-gradient(139.26deg, #397F20 21.25%, #639D4E 90.93%)",
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
      "linear-gradient(139.26deg, #976C2F 21.25%, #AC8449 90.93%)",
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
      "linear-gradient(139.26deg, #0F6876 21.25%, #178D8D 90.93%)",
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
      "linear-gradient(139.26deg, #2E0F82 21.25%, #6739D3 90.93%)",
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
      "linear-gradient(139.26deg, #B906D8 21.25%, #CB2EE5 90.93%)",
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
      "linear-gradient(139.26deg, #23796C 21.25%, #6DC6B9 90.93%)",
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
