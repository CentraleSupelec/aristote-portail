import Choice from "./Choice";
import AnswerPointer from "./AnswerPointer";

export default interface MultipleChoiceQuestion {
    id: string,
    explanation: string,
    question: string,
    answerPointer: AnswerPointer,
    choices: Choice[],
    evaluation: Object,
    thumbUp: boolean,
    userFeedback: string
}
