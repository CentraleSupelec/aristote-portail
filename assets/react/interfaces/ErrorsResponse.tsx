import Error from "./Error";

export default interface Enrichments {
    errors: Error[],
    status: string
}
