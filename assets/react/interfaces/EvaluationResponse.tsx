import EnrichmentVersion from "./EnrichmentVersion";

export default interface EvaluationResponse {
    status: string,
    enrichmentVersion: EnrichmentVersion,
}
