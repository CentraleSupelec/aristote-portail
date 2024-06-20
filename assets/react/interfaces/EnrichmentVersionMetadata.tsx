export default interface EnrichmentVersionMetadata {
    title: string,
    translatedTitle?: string,
    description: string,
    translatedDescription?: string,
    discipline: string,
    mediaType: string,
    topics: string[],
    translatedTopics?: string[],
    thumbUpTitle: boolean,
    thumbUpDescription: boolean,
    thumbUpTopics: boolean,
    thumbUpDiscipline: boolean,
    thumbUpMediaType: boolean,
    userFeedback: string
}
