export default interface Choice {
    id: string,
    optionText: string,
    translatedOptionText?: string,
    correctAnswer: boolean,
    thumbUp: boolean
}
