import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";

const FAQData = [
    {
        question: "What types of resources do you offer for AP students?", 
        answer: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corrupti cupiditate repellendus ea perferendis error cumque tempore impedit aperiam architecto dolorum similique numquam nobis quisquam harum corporis itaque quibusdam, laudantium tenetur laborum ipsum. Nobis hic veritatis nisi ducimus atque repellat harum!"
    },
    {
        question: "Who creates the resources?", 
        answer: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corrupti cupiditate repellendus ea perferendis error cumque tempore impedit aperiam architecto dolorum similique numquam nobis quisquam harum corporis itaque quibusdam, laudantium tenetur laborum ipsum. Nobis hic veritatis nisi ducimus atque repellat harum!"
    },
    {
        question: "How can I contribute?", 
        answer: "We welcome contributions from AP students like you! Whether you have study notes, practice exams, or helpful tips to share, you can submit your content to be reviewed and added to our resource library. Join us in building a community-driven platform for AP exam preparation."
    }
];



const FAQ = () => {
    return (
      <>
        {FAQData.map((FAQ, index) => (
          <AccordionItem value={`item-${index + 1}`}>
          <AccordionTrigger className={`${index === 0 && "text-left"} text-2xl font-bold`}>
            {`${FAQ.question}`}
          </AccordionTrigger>
          <AccordionContent>
            {`${FAQ.answer}`}
          </AccordionContent>
        </AccordionItem>
        ))}
      </>
    );
  };
  
  export default FAQ;