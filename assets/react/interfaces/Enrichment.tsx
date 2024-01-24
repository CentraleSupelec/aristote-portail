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
    createdAt: string
}
