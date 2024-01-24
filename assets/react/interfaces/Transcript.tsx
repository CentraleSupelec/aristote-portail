import Sentence from "./Sentence";

export default interface Transcript {
    language: string,
    originalFilename: string,
    text: string,
    sentences: Sentence[],
}
