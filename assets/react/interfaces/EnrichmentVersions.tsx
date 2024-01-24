import EnrichmentVersion from "./EnrichmentVersion";

export default interface EnrichmentVersions {
    content: EnrichmentVersion[],
    currentPage: number,
    totalElements: number,
    isLastPage: boolean
}
