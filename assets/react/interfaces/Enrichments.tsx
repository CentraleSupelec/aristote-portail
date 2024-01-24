import Enrichment from "./Enrichment";

export default interface Enrichments {
    content: Enrichment[],
    currentPage: number,
    totalElements: number,
    isLastPage: boolean
}
