import EnrichmentVersionMetadata from "./EnrichmentVersionMetadata";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import Transcript from "./Transcript";

export default interface EnrichmentVersion {
    id: string,
    createdAt: string,
    updatedAt: string,
    enrichmentVersionMetadata: EnrichmentVersionMetadata,
    multipleChoiceQuestions: MultipleChoiceQuestion[],
    transcript: Transcript,
    initialVersion: boolean,
    lastEvaluationDate: string,
    aiGenerated: boolean,
    language: string,
    translateTo: string,
    notes: string,
    translatedNotes: string
}
