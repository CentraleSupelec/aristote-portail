import SelectOption from "../interfaces/SelectOption";

export const AVAILABLE_LANGUAGES: SelectOption[] = [
    {value: 'fr', label: 'Français'},
    {value: 'en', label: 'Anglais'},
]

export const MEDIA_TYPES: SelectOption[] = [
    {value: 'Conférence', label: 'Conférence'},
    {value: 'Cours', label: 'Cours'},
    {value: 'Amphi', label: 'Amphi'}
]

export const AVAILABLE_AIS: SelectOption[] = [
    {value: 'ChatGPT', label: 'ChatGPT'},
]

export const TREATMENT_METADATA = 'metadata'
export const TREATMENT_QUIZ = 'quiz'
export const TREATMENT_NOTES = 'notes'

export const AVAILABLE_TREATMENTS: SelectOption[] = [
    {value: TREATMENT_METADATA, label: 'Métadonnées'},
    {value: TREATMENT_QUIZ, label: 'Quiz'},
    {value: TREATMENT_NOTES, label: 'Prise de notes'},
]

export const DEFAULT_TREATMENTS: SelectOption[] = [
    {value: TREATMENT_METADATA, label: 'Métadonnées'},
    {value: TREATMENT_QUIZ, label: 'Quiz'},
]

export const NOTIFICATION_URL = window.location.origin.replace('localhost', 'host.docker.internal');
