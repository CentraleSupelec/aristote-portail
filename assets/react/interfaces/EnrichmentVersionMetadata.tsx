export default interface EnrichmentVersionMetadata {
    title: string,
    description: string,
    discipline: string,
    mediaType: string,
    topics: string[],
    thumbUpTitle: boolean,
    thumbUpDescription: boolean,
    thumbUpTopics: boolean,
    thumbUpDiscipline: boolean,
    thumbUpMediaType: boolean,
    userFeedback: string
}
