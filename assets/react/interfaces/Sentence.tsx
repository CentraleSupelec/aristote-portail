export default interface Sentence {
    id: number,
    start: number,
    end: number,
    no_caption_prob: number,
    no_speech_prob: number,
    text: string,
}
