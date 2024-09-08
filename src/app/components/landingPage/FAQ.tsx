import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

// Goes in backend

// If multiple questions have the same answer, the opening of the accordion breaks
const FAQData = [
  {
    question: "What types of resources do you offer for AP students?",
    answer:
      "We offer a wide range of resources for AP students, including study notes, practice exams, and helpful tips. Our resources are designed to help students prepare for AP exams and achieve their academic goals. Whether you're a first-time AP student or a seasoned AP student, we have something for you.",
  },
  {
    question: "Who creates the resources?",
    answer:
      "People from all over the world have contributed to our resource library. We welcome contributions from AP students like you! Whether you have study notes, practice exams, or helpful tips to share, you can submit your content to be reviewed and added to our resource library. Join us in building a community-driven platform for AP exam preparation.",
  },
  {
    question: "How can I contribute?",
    answer:
      "We welcome contributions from AP students like you! Whether you have study notes, practice exams, or helpful tips to share, you can submit your content to be reviewed and added to our resource library. Join us in building a community-driven platform for AP exam preparation.",
  },
];

const FAQ = () => {
  return (
    <>
      {FAQData.map((FAQ, index) => (
        <AccordionItem value={`item-${index + 1}`} key={FAQ.question}>
          <AccordionTrigger
            className={`${index === 0 && "text-left"} text-2xl font-bold`}
          >
            {`${FAQ.question}`}
          </AccordionTrigger>
          <AccordionContent>{`${FAQ.answer}`}</AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
};

export default FAQ;
