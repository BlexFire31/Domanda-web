import { isEmpty } from "../utils/isEmpty";
import { Question } from "../models/Question";

export function verifyQuizData(questions: Question[]): boolean {
  for (let question of questions) {
    if (isEmpty(question.options[question.correctAnswer])) return false; // The option that corresponds to the correct answer is empty

    // option A and B are empty
    if (isEmpty(question.options.optionA)) return false;
    if (isEmpty(question.options.optionB)) return false;
  }
  return true;
}
