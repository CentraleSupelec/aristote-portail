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

export const NOTIFICATION_URL = window.location.origin.replace('localhost', 'host.docker.internal');
