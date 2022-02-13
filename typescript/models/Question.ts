import { option } from "./option";
import { options } from "./options";

export class Question {
  options: options;
  correctAnswer: option;
  title: string;
  constructor(title: string, options: options, correctAnswer: option) {
    this.options = options;
    this.correctAnswer = correctAnswer;
    this.title = title;
  }
}
