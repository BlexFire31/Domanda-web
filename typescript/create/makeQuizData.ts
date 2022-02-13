import { Question } from "../models/Question";

export function makeQuizData(): Question[] {
  return [new Question("Title", { optionA: "hi" }, "optionA")];
}
