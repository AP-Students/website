// questionIdManager.ts
let questionInstanceId = 0;

// Function to get the current instance ID
export const getQuestionInstanceId = () => questionInstanceId;

// Function to increment the instance ID
export const incrementQuestionInstanceId = () => {
  questionInstanceId += 1;
};
