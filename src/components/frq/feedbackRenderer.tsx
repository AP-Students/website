interface Props {
   feedbackFound: boolean;
}

export default function FRQFeedbackRenderer({ feedbackFound }: Props) {
   if (feedbackFound) {
     return <p>Success.</p>;
   }
   return <p>Failed.</p>;
 }


