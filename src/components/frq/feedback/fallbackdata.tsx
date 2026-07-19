// import type { FRQFeedbackDocument } from "./types";

// export const fallbackFeedbackData: FRQFeedbackDocument = {
//   name: "AP Human Geography FRQ 1",
//   creatorId: "1259823594",
//   mostRecentEditor: "1259823594",
//   id: "43281",
//   isVisible: true,

//   feedback: {
//     id: "47231",
//     graderId: "964923741",
//     submittedAt: "2026-07-13T18:30:00Z",
//     questions: [
//       {
//         questionId: "53213",
//         graderFeedback:
//           "This is a very solid response. Work on your evidence and make sure to explain the demographic shift more clearly in future answers.",
//         gradingCriteria: [
//           {
//             criterionId: "59684",
//             awardedPoints: 3,
//           },
//           {
//             criterionId: "85931",
//             awardedPoints: 1,
//           },
//         ],
//       },
//       {
//         questionId: "53214",
//         graderFeedback: "This answer needs more explanation.",
//         gradingCriteria: [
//           {
//             criterionId: "59685",
//             awardedPoints: 1,
//           },
//           {
//             criterionId: "85930",
//             awardedPoints: 1,
//           },
//         ],
//       },
//       {
//         questionId: "63213",
//         graderFeedback:
//           "Good start, but the evidence could be stronger.",
//         gradingCriteria: [
//           {
//             criterionId: "69684",
//             awardedPoints: 3,
//           },
//           {
//             criterionId: "75931",
//             awardedPoints: 0,
//           },
//         ],
//       },
//     ],
//   },

//   response: {
//     id: "47231",
//     userId: "3749237134",
//     submittedAt: "2026-07-13T18:30:00Z",
//     answers: [
//       {
//         questionId: "53213",
//         value: "1-1 Answer",
//       },
//       {
//         questionId: "53214",
//         value: "1-2 Answer",
//       },
//       {
//         questionId: "63213",
//         value: "2-1 Answer",
//       },
//     ],
//   },

//   frqs: [
//     {
//       id: "12345",
//       name: "FRQ 1",
//       description: {
//         value:
//           "Choice A is incorrect. As $@x = 1$ is a vertical asymptote, the limit as the function approaches that value will not be a definite number, but some infinity. Choice B is incorrect. It is true that as the limit of a function approaches a vertical asymptote, it will approach an infinity. However, we can use simple numerical logic to guide and realize that $@\\displaystyle\\frac{0.9999}{0.9999^2 - 1}$ will be negative, since $@1^-$ indicates a quantity that is slightly smaller than 1. Choice C is correct. A vertical asymptote exists at $@x = 1$, so the one-sided limit will yield an infinite value. As $@x$ approaches $@1$ from the left of the function, the denominator approaches a very small negative value and the numerator is positive. This evaluates to a large negative number, indicating that the limit is $@-\\infty$. Choice D is incorrect. To some extent, it is true that if a limit approaches infinity, it is a case of DNE since it experiences unbounded change. HOWEVER, the convention will ALWAYS be to specify whether or not it is a $@\\pm \\infty$, which makes C a better answer.",
//         files: [],
//       },
//       isVisible: true,
//       questions: [
//         {
//           id: "53213",
//           name: "Question 1",
//           isVisible: true,
//           prompt: {
//             value: "This is a prompt for frq 1 question 1",
//             files: [],
//           },
//           answerType: "text",
//           gradingCriteria: [
//             {
//               id: "59684",
//               text: "Correct Grammar",
//               possiblePoints: 4,
//             },
//             {
//               id: "85931",
//               text: "Mentions Demographics",
//               possiblePoints: 2,
//             },
//           ],
//         },
//         {
//           id: "53214",
//           name: "Question 2",
//           isVisible: true,
//           prompt: {
//             value: "This is a prompt for frq 1 question 2",
//             files: [],
//           },
//           answerType: "text",
//           gradingCriteria: [
//             {
//               id: "59685",
//               text: "Correct Math",
//               possiblePoints: 1,
//             },
//             {
//               id: "85930",
//               text: "Aura",
//               possiblePoints: 2,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       id: "95312",
//       name: "FRQ 2",
//       description: {
//         value:
//           "Choice A is incorrect. As $@x = 1$ is a vertical asymptote, the limit as the function approaches that value will not be a definite number, but some infinity. Choice B is incorrect. It is true that as the limit of a function approaches a vertical asymptote, it will approach an infinity. However, we can use simple numerical logic to guide and realize that $@\\displaystyle\\frac{0.9999}{0.9999^2 - 1}$ will be negative, since $@1^-$ indicates a quantity that is slightly smaller than 1. Choice C is correct. A vertical asymptote exists at $@x = 1$, so the one-sided limit will yield an infinite value. As $@x$ approaches $@1$ from the left of the function, the denominator approaches a very small negative value and the numerator is positive. This evaluates to a large negative number, indicating that the limit is $@-\\infty$.",
//         files: [],
//       },
//       isVisible: true,
//       questions: [
//         {
//           id: "63213",
//           name: "Question 1",
//           isVisible: true,
//           prompt: {
//             value: "This is a prompt for frq 2 question 1",
//             files: [],
//           },
//           answerType: "text",
//           gradingCriteria: [
//             {
//               id: "69684",
//               text: "Correct Grammar",
//               possiblePoints: 4,
//             },
//             {
//               id: "75931",
//               text: "Mentions Demographics",
//               possiblePoints: 2,
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };