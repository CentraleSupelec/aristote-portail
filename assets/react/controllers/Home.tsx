import React, { BaseSyntheticEvent, ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Alert, Button, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import makeAnimated from "react-select/animated";
import Enrichments from '../interfaces/Enrichments';
import EnrichmentsList from '../components/EnrichmentsList';
import SelectOption from '../interfaces/SelectOption';
import AiModelInfrastructureCombination from '../interfaces/AiModelInfrastructureCombination';
import { AVAILABLE_AIS, AVAILABLE_LANGUAGES, AVAILABLE_TREATMENTS, DEFAULT_TREATMENTS, MEDIA_TYPES, NOTIFICATION_URL, TREATMENT_METADATA, TREATMENT_NOTES, TREATMENT_QUIZ } from '../constants';
import ErrorsResponse from '../interfaces/ErrorsResponse';
import Error from '../interfaces/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';

export default function () {
    const MAX_FILE_SIZE = 734003200;
    const [enrichments, setEnrichments] = useState<Enrichments>();
    const [aiModelInfrastructureCombinations, setAiModelInfrastructureCombinations] = useState<AiModelInfrastructureCombination[]>([]);
    const [selectedMediaTypes, setSelectedMediaTypes] = useState<SelectOption[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<SelectOption[]>([]);
    const [selectedAiModelInfrastructureCombination, setSelectedAiModelInfrastructureCombination] = useState<AiModelInfrastructureCombination>();
    const [selectedTreatments, setSelectedTreatments] = useState<SelectOption[]>(DEFAULT_TREATMENTS);
    const [selectedEvaluationAi, setSelectedEvaluationAi] = useState<SelectOption>();
    const [selectedLanguage, setSelectedLanguage] = useState<SelectOption>();
    const [selectedTranslateTo, setSelectedTranslateTo] = useState<SelectOption>();
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [uploadViaUrl, setUploadViaUrl] = useState<boolean>(true);
    const [validUrl, setValidUrl] = useState<boolean>(null);
    const [errors, setErrors] = useState<Error[]>([]);
    const [page, setPage] = useState<number>(1);

    const toggleModal = () => {
        setShowModal(!showModal);
        setShowAlert(false);
        setUploadViaUrl(true);
        setShowSpinner(false);
        setDisableForm(false);
        setSelectedLanguage(null);
        setSelectedTranslateTo(null);
        setValidUrl(null);
        setErrors([])
    };

    const animatedComponents = makeAnimated();

    useEffect(() => {
        fetchEnrichments();
        fetchAiModelInfrastructureCombinations();
    }, []);

    const fetchEnrichments = (page: number = 1) => {
        fetch(Routing.generate('app_enrichments') + `?page=${page}`)
            .then(response => response.json())
            .then((data: Enrichments) => {
                setPage(page);
                setEnrichments(data);
            })
    }

    const fetchAiModelInfrastructureCombinations = () => {
        fetch(Routing.generate('app_get_ai_model_infrastructure_combinations'))
            .then(response => response.json())
            .then((data: AiModelInfrastructureCombination[]) => {
                setAiModelInfrastructureCombinations(data);
            })
    }

    const uploadVideo = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        setDisableForm(true);
        setShowSpinner(true);
        setShowAlert(false);
        const enrichmentParameters = {
            mediaTypes: selectedMediaTypes.map(mediaType => mediaType.value),
            disciplines: selectedDisciplines.map(discipline => discipline.value),
            generateMetadata: false,
            generateQuiz: false,
            generateNotes: false
        }

        if (selectedTreatments.filter(treatment => treatment.value === TREATMENT_METADATA).length !== 0) {
            enrichmentParameters.generateMetadata = true;
        }

        if (selectedTreatments.filter(treatment => treatment.value === TREATMENT_QUIZ).length !== 0) {
            enrichmentParameters.generateQuiz = true;
        }

        if (selectedTreatments.filter(treatment => treatment.value === TREATMENT_NOTES).length !== 0) {
            enrichmentParameters.generateNotes = true;
        }

        // if (selectedEvaluationAi) {
        //     enrichmentParameters['aiEvaluation'] = selectedEvaluationAi.value;
        // }

        if (selectedLanguage) {
            enrichmentParameters['language'] = selectedLanguage.value;
        }

        if (selectedTranslateTo) {
            enrichmentParameters['translateTo'] = selectedTranslateTo.value;
        }

        enrichmentParameters['aiModel'] = null;
        enrichmentParameters['infrastructure'] = null;

        if (selectedAiModelInfrastructureCombination) {
            enrichmentParameters['aiModel'] = selectedAiModelInfrastructureCombination.aiModel;
            enrichmentParameters['infrastructure'] = selectedAiModelInfrastructureCombination.infrastructure;
        }

        if (uploadViaUrl) {
            const url = event.target[2].value;

            fetch(Routing.generate('app_create_enrichment_by_url'), {
                method: 'POST',
                body: JSON.stringify({
                    url,
                    notificationWebhookUrl: NOTIFICATION_URL + Routing.generate('app_enrichment_notification'),
                    enrichmentParameters
                })
            })
            .then(response => {
                    setDisableForm(false);
                    setShowSpinner(false);
                    if (response.status === 200) {
                        fetchEnrichments();
                        toggleModal();
                    } else {
                        setShowAlert(true);
                        return response.json()
                    }
                }
            ).then((errorsResponse: ErrorsResponse) => { 
                if (errorsResponse) {
                    setErrors(errorsResponse.errors)
                }
            })
        } else {
            const file = event.target[2].files[0];
            const params = new FormData();
            params.append('file', file);
            params.append('notificationWebhookUrl', NOTIFICATION_URL + Routing.generate('app_enrichment_notification'));
            params.append('enrichmentParameters', JSON.stringify(enrichmentParameters))

            fetch(Routing.generate("app_create_enrichment_by_file"), {
                    method: 'POST',
                    body: params
                })
                .then(response => {
                        setDisableForm(false);
                        setShowSpinner(false);
                        if (response.status === 200) {
                            fetchEnrichments();
                            toggleModal();
                        } else {
                            setShowAlert(true);
                            return response.json()
                        }
                    }
                ).then((errorsResponse: ErrorsResponse) => {  
                    if (errorsResponse) {
                        setErrors(errorsResponse.errors)
                    }
                })
        }
    }

    const onMediaTypesChange = (newValue: SelectOption[]) => {
        setSelectedMediaTypes(newValue);
    }

    const onDisciplinesChange = (newValue: SelectOption[]) => {
        setSelectedDisciplines(newValue);
    }

    const onAiChange = (newValue: SelectOption) => {
        setSelectedEvaluationAi(newValue);
    }

    const onLanguageChange = (newValue: SelectOption) => {
        setSelectedLanguage(newValue);
        if (selectedTranslateTo && newValue.value === selectedTranslateTo.value) {
            setSelectedTranslateTo(null);
        }
    }

    const onTranslateToChange = (newValue: SelectOption) => {
        setSelectedTranslateTo(newValue);
        if (selectedLanguage && newValue.value === selectedLanguage.value) {
            setSelectedLanguage(null);
        }
    }

    const onAiModelInfrastructureCombinationChange = (newValue: AiModelInfrastructureCombination) => {
        setSelectedAiModelInfrastructureCombination(newValue);
    }

    const onTreatmentChange = (newValue: SelectOption[]) => {
        if (newValue.length === 0) {
            setSelectedTreatments(newValue)
        } else if (newValue[newValue.length - 1].value === TREATMENT_NOTES) {
            setSelectedTreatments([newValue[newValue.length - 1]]);
        } else {
            let treatmentNotesIndex = newValue.findIndex(treatment => treatment.value === TREATMENT_NOTES)
            if (treatmentNotesIndex !== -1) {
                newValue.splice(treatmentNotesIndex, 1)
            }
            setSelectedTreatments(newValue)
        }
    }

    const getValue = (aiModelInfrastructureCombination: AiModelInfrastructureCombination) => {
        return aiModelInfrastructureCombination.aiModel + '@' + aiModelInfrastructureCombination.infrastructure
    }

    const onFileChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent): void => {
        setErrors(errors.filter(error => error.path !== 'file'));
        const files: FileList = event.target['files'];
        if (files[0].size > MAX_FILE_SIZE) {
            setErrors([...errors, {path: 'file', message: 'La taille du fichier dépasse la taille maximale de 700 Mo'}])
            setDisableForm(true);
        } else {
            setDisableForm(false);
        }
    }

    const toggleUploadMethod = () => {
        setErrors(errors.filter(error => error.path !== 'file' && error.path !== 'url'));
        setUploadViaUrl(!uploadViaUrl);
        setValidUrl(null);
        setDisableForm(false);
    }

    const validateUrl = async (event) => {
        const url = event.target.parentElement.childNodes[0].value;

        fetch(Routing.generate("validate_url"), {
            method: 'POST',
            body: JSON.stringify({
                url
            })
        })
            .then(response => response.json())
            .then(data => {
                let newValidaUrl = data['validUrl']
                setValidUrl(newValidaUrl);
                if (!newValidaUrl) {
                    let newErrors = errors.filter(error => error.path != "url")
                    setErrors([...newErrors, {
                        path: "url",
                        message: "Le lien doit permettre le téléchargement du fichier vidéo ou audio ; un lien vers un lecteur média (youtube, vimeo, ...) ne pourra pas être utilisé pour créer un enrichissement"
                    }])
                } else {
                    setErrors(errors.filter(error => error.path != "url"))
                }
            }
        )
    }

    const renderTooltip = (props: OverlayInjectedProps) => {
        return (<Tooltip id="create-enrichment-tooltip" {...props}>
            Vérifier le lien que avez saisi
        </Tooltip>)
    };

    return (
        <div className='d-flex flex-column align-items-center'>
            <div>
                <Button id='open-enrichment-creation-modal-button' onClick={() => toggleModal()}>
                    Créer un enrichissement
                </Button>
                <Modal show={showModal} onHide={toggleModal} size='lg'>
                    <Modal.Header closeButton>
                        <Modal.Title>Créer un enrichissement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {showAlert &&
                            <Alert variant='danger' dismissible>
                                Une erreur s'est produite. Veuillez réessayer.
                            </Alert>
                        }
                        <Form onSubmit={uploadVideo}>
                            <div className='mb-4'>
                                <Form.Check
                                    inline
                                    label="Téléverser via URL"
                                    name="uploadType"
                                    type='radio'
                                    checked={uploadViaUrl}
                                    onChange={toggleUploadMethod}
                                />
                                <Form.Check
                                    inline
                                    label="Téléverser depuis votre ordinateur"
                                    name="uploadType"
                                    type='radio'
                                    checked={!uploadViaUrl}
                                    onChange={toggleUploadMethod}
                                />
                            </div>
                            {uploadViaUrl? 
                                <Form.Group className="mb-3" controlId="mediaUpload.url">
                                    <Form.Label>URL du fichier média téléchargeable*</Form.Label>
                                    <div className='d-flex'>
                                        <Form.Control
                                            onChange={() => setValidUrl(null)}
                                            className='me-2'
                                            placeholder="Entrez l’URL de votre fichier vidéo ou audio (mp4, webM, mp3 ...)"
                                            type="string"
                                            isInvalid={errors.filter(error => error.path === 'url').length > 0}
                                        />
                                        <FontAwesomeIcon className={`text-${validUrl? 'success': 'danger'} align-self-center me-2 opacity-${null == validUrl? '0': '100'}`} icon={validUrl? "circle-check": "circle-xmark"} size='xl' />
                                        <Button onClick={validateUrl}>Tester</Button>
                                    </div>
                                    {errors.filter(error => error.path === 'url').map((error, index) => {
                                        return <Alert variant='danger' className='my-3 py-1' key={`error-url-${index}`}>
                                            <Form.Control.Feedback className='d-flex' type="invalid">{error.message}</Form.Control.Feedback>
                                        </Alert>
                                    })}
                                </Form.Group>
                                :
                                <Form.Group className="mb-3" controlId="mediaUpload.file">
                                    <Form.Label>Téléverser le fichier média*</Form.Label>
                                    <Form.Control
                                        type="file"
                                        onChange={onFileChange}
                                        isInvalid={errors.filter(error => error.path === 'file').length > 0}
                                    />
                                    {errors.filter(error => error.path === 'file').map((error, index) => {
                                        return <Form.Control.Feedback type="invalid" key={`error-file-${index}`}>{error.message}</Form.Control.Feedback>
                                    })}
                                </Form.Group>
                            }
                            <Form.Group className="mb-3" controlId="mediaUpload.treatments">
                                <Form.Label>Traitement</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={AVAILABLE_TREATMENTS}
                                    placeholder="Choisir les traitements"
                                    value={selectedTreatments}
                                    onChange={onTreatmentChange}
                                    isClearable
                                    isMulti
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="mediaUpload.aiEvaluation">
                                <Form.Label>Modèle et infrastructure</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={aiModelInfrastructureCombinations}
                                    placeholder="Choisissez le modèle qui va enrichir votre média et l'infrastructure sur laquelle il va tourner"
                                    onChange={onAiModelInfrastructureCombinationChange}
                                    getOptionLabel={getValue}
                                    getOptionValue={getValue}
                                    isClearable
                                />
                            </Form.Group>
                            {/* <Form.Group className="mb-3" controlId="mediaUpload.aiEvaluation">
                                <Form.Label>IA d'évaluation</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={AVAILABLE_AIS}
                                    placeholder="Choisissez l'IA qui évaluera la proposition d'Aristote"
                                    onChange={onAiChange}
                                    isClearable
                                />
                            </Form.Group> */}
                            {selectedTreatments && selectedTreatments.filter(treatment => treatment.value === TREATMENT_METADATA).length > 0 &&
                                <>
                                    <Form.Group className="mb-3" controlId="mediaUpload.disciplines">
                                        <Form.Label className='mb-1'>Disciplines*</Form.Label>
                                        <div className='text-black-50 small mb-2'>
                                            Aristote choisira la discipline principale de votre média parmi la liste que vous lui proposez
                                        </div>
                                        <CreatableSelect
                                            className='mb-3'
                                            components={animatedComponents}
                                            isMulti
                                            placeholder='Mathématiques, Sociologie, Chimie, ...'
                                            onChange={onDisciplinesChange}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="mediaUpload.mediaTypes">
                                        <Form.Label className='mb-1'>Nature du média*</Form.Label>
                                        <div className='text-black-50 small mb-2'>
                                            Aristote choisira la nature de votre média parmi la liste que vous lui proposez
                                        </div>
                                        <CreatableSelect
                                            className='mb-3'
                                            components={animatedComponents}
                                            isMulti
                                            options={MEDIA_TYPES}
                                            placeholder='Conférence, cours, webinaire, ...'
                                            onChange={onMediaTypesChange}
                                            required
                                        />
                                    </Form.Group>
                                </>
                            }
                            <Form.Group className="mb-3" controlId="mediaUpload.language">
                                <Form.Label>Langue du média</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={AVAILABLE_LANGUAGES}
                                    placeholder="Vous pouvez spécifier la langue du média"
                                    onChange={onLanguageChange}
                                    value={selectedLanguage}
                                    isClearable
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="mediaUpload.translateTo">
                                <Form.Label>Traduire l'enrichissement en</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={AVAILABLE_LANGUAGES}
                                    placeholder="Vous pouvez demander la traduction de l'enrichissement"
                                    onChange={onTranslateToChange}
                                    value={selectedTranslateTo}
                                    isClearable
                                />
                            </Form.Group>
                            <div className='d-flex justify-content-end'>
                                <OverlayTrigger
                                    placement="top"
                                   overlay={!showSpinner && uploadViaUrl && !validUrl? renderTooltip: <></>}
                                >
                                    <div>
                                        <Button id='create-enrichment-button' type='submit' disabled={disableForm || (uploadViaUrl && !validUrl)}>
                                            {showSpinner ?
                                                <Spinner animation="border" size="sm" />
                                                :
                                                <span>
                                                    Créer un enrichissement
                                                </span>
                                            }
                                        </Button>
                                    </div>
                                </OverlayTrigger>

                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
            <div className='mt-5 w-100'>
                <EnrichmentsList 
                    enrichments={enrichments}
                    fetchEnrichments={fetchEnrichments}
                    aiModelInfrastructureCombinations={aiModelInfrastructureCombinations}
                />
            </div>
            {enrichments && 
                <div className='mt-5 w-100'>
                    <div className='d-flex justify-content-center'>
                        {page > 1 &&
                            <>

                                <Button className='mx-1' onClick={() => fetchEnrichments(page - 1)} variant='secondary'>
                                    &lt;
                                </Button>
                                <Button className='mx-1' variant='secondary' onClick={() => fetchEnrichments(page - 1)}>
                                    {page - 1}
                                </Button>
                            </>
                        }
                        {enrichments.totalElements !== 0 &&
                            <Button className='mx-1'>
                                {page}
                            </Button>
                        }
                        {!enrichments.isLastPage && 
                            <>
                                <Button className='mx-1' variant='secondary' onClick={() => fetchEnrichments(page + 1)}>
                                    {page + 1}
                                </Button>
                                <Button className='mx-1' onClick={() => fetchEnrichments(page + 1)} variant='secondary'>
                                    &gt;
                                </Button>
                            </>
                        }
                    </div>
                </div>
            }
        </div>
    )
}
