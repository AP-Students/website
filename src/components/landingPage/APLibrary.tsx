import APsection from "./APsection";

const sectionData = [
  {
    title: "Math and Computer Science",
    numofCol: "lg:col-span-2",
    borderColor: "#2563eb",
    courses: [
      {title: "AP Calculus AB", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/calculus-ab"
        },
      ]},
      {title: "AP Calculus BC", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/calculus-bc"
        },
      ]},
      {title: "AP Precalculus", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/precalculus"
        },
      ]},
      {title: "AP Statistics", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/statistics"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/statistics-formula-sheet-and-tables-2020.pdf"
        },
        {
          title: "AP Stats FAQ",
          url: "https://bit.ly/apstats-faq"
        },
      ]},
      {title: "AP Computer Science Principles", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/computer-science-principles"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-exam-reference-sheet.pdf"
        },
      ]},
      {title: "AP Computer Science A", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/computer-science-a"
        },
        {
          title: "Reference Sheet",
          url: "https://apstudents.collegeboard.org/ap/pdf/ap-computer-science-a-java-quick-reference_0.pdf"
        },
      ]},
    ],
  },
  {
    title: "English",
    numofCol: "lg:col-span-1",
    borderColor: "#dc2626",
    courses: [
      {title: "AP English Language", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/english-language"
        },
      ]},
      {title: "AP English Literature", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/english-literature"
        },
      ]},
    ],
  },
  {
    title: "Sciences",
    numofCol: "lg:col-span-3",
    borderColor: "#16a34a",
    courses: [
      {title: "AP Biology", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/biology"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-biology-equations-and-formulas-sheet.pdf"
        },
      ]},
      {title: "AP Chemistry", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/chemistry"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-chemistry-equations-sheet.pdf"
        },
        {
          title: "Periodic Table",
          url: "https://apcentral.collegeboard.org/media/pdf/chemistry-periodic-table-2020.pdf"
        }
      ]},
      {title: "AP Environmental Science", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/environmental-science"
        },
      ]},
      {title: "AP Physics 1", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/physics-1"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-sheet.pdf"
        },
      ]},
      {title: "AP Physics 2", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/physics-2"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-2-equations-sheet.pdf"
        },
      ]},
      {title: "AP Physics C: E&M", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/physics-c-em"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-c-electricity-and-magnetism-equations-sheet.pdf"
        },
      ]},
      {title: "AP Physics C: Mechanics", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/physics-c-mechanics"
        },
        {
          title: "Reference Sheet",
          url: "https://apcentral.collegeboard.org/media/pdf/physics-cm-equations-sheet-2020.pdf"
        },
      ]},
    ],
  },
  {
    title: "History",
    numofCol: "lg:col-span-1",
    borderColor: "#9f1239",
    courses: [
      {title: "AP European History", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/european-history"
        },
      ]},
      {title: "AP US History", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/us-history"
        },
      ]},
      {title: "AP World History: Modern", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/world-history-modern"
        },
      ]},
    ],
  },
  {
    title: "Social Sciences",
    numofCol: "lg:col-span-2",
    borderColor: "#f97316",
    courses: [
      {title: "AP Comparative Government", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/comparative-government"
        },
      ]},
      {title: "AP Human Geography", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/human-geography"
        },
      ]},
      {title: "AP Macroeconomics", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/macroeconomics"
        },
      ]},
      {title: "AP Microeconomics", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/microeconomics"
        },
      ]},
      {title: "AP United States Government", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/united-states-government"
        },
      ]},
      {title: "AP Psychology", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/psycology"
        },
      ]},
      {title: "AP African American Studies", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/african-american-studies"
        },
      ]},
    ],
  },
  {
    title: "World Languages and Cultures",
    numofCol: "lg:col-span-3",
    borderColor: "#a21caf",
    courses: [
      {title: "AP Chinese", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/chinese"
        },
      ]},
      {title: "AP French", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/french"
        },
      ]},
      {title: "AP German", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/german"
        },
      ]},
      {title: "AP Italian", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/italian"
        },
      ]},
      {title: "AP Japanese", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/japanese"
        },
      ]},
      {title: "AP Latin", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/latin"
        },
      ]},
      {title: "AP Spanish Language", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/spanish-language"
        },
      ]},
      {title: "AP Spanish Literature", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/spanish-literature"
        },
      ]},
    ],
  },
  {
    title: "Arts",
    numofCol: "lg:col-span-2",
    borderColor: "#f59e0b",
    courses: [
      {title: "AP 2-D Art and Design", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/2d-art-and-design"
        },
      ]},
      {title: "AP 3-D Art and Design", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/3d-art-and-design"
        },
      ]},
      {title: "AP Art History", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/art-history"
        },
      ]},
      {title: "AP Drawing", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/drawing"
        },
      ]},
      {title: "AP Music Theory", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/music-theory"
        },
      ]},
    ],
  },
  {
    title: "AP Capstone",
    numofCol: "lg:col-span-1",
    borderColor: "#0891b2",
    courses: [
      {title: "AP Research", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/research"
        },
      ]}, 
      {title: "AP Seminar", referenceURLs: [
        {
          title: "Fivehive Curriculum",
          url: "/subject/seminar"
        },
      ]},
    ],
  },
];

const APLibrary = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {sectionData.map((section) => (
        <APsection
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
