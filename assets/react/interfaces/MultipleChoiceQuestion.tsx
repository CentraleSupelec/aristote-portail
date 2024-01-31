import Choice from "./Choice";
import AnswerPointer from "./AnswerPointer";
import Evaluation from "./Evaluation";

export default interface MultipleChoiceQuestion {
    id: string,
    explanation: string,
    question: string,
    answerPointer: AnswerPointer,
    choices: Choice[],
    evaluation: Evaluation,
    thumbUp: boolean,
    userFeedback: string
}
