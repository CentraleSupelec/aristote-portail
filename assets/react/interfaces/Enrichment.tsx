import Media from "./Media";

export default interface Enrichment {
    aiEvaluation: string,
    disciplines: string[],
    failureCause: string,
    id: string,
    initialVersionId: string,
    mediaTypes: string[],
    notificationStatus: string,
    notifiedAt: string,
    status: string,
    media: Media,
    createdAt: string,
    transcribedBy?: Worker,
    aiProcessedBy?: Worker,
    aiEvaluatedBy?: Worker,
    aiEnrichmentEndedAt?: string,
    aiEnrichmentStartedAt?: string,
    aiEvaluationEndedAt?: string,
    aiEvaluationStartedAt?: string,
    transribingEndedAt?: string,
    transribingStartedAt?: string,
    language?: string,
    translateTo?: string,
    endUserIdentifier: string,
    contributors: string[],
    aiGenerationCount: number
}
