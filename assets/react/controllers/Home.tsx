import React, { BaseSyntheticEvent, ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
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
    const [errors, setErrors] = useState<Error[]>([]);

    const toggleModal = () => {
        setShowModal(!showModal);
        setShowAlert(false);
        setUploadViaUrl(true);
        setShowSpinner(false);
        setDisableForm(false);
        setSelectedLanguage(null);
        setSelectedTranslateTo(null);
        setErrors([])
    };

    const animatedComponents = makeAnimated();

    useEffect(() => {
        fetchEnrichments();
        fetchAiModelInfrastructureCombinations();
    }, []);

    const fetchEnrichments = () => {
        fetch(Routing.generate('app_enrichments'))
            .then(response => response.json())
            .then(data => {
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
        setDisableForm(false);
    }

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
                                    <Form.Label>URL du fichier média*</Form.Label>
                                    <Form.Control
                                        placeholder="Entrez l'URL de votre fichier"
                                        type="string"
                                        isInvalid={errors.filter(error => error.path === 'url').length > 0}
                                    />
                                    {errors.filter(error => error.path === 'url').map((error, index) => {
                                        return <Form.Control.Feedback type="invalid" key={`error-url-${index}`}>{error.message}</Form.Control.Feedback>
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
                            <Form.Group className="mb-3" controlId="mediaUpload.aiEvaluation">
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
                            {selectedTreatments.filter(treatment => treatment.value === TREATMENT_METADATA).length > 0 &&
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
                                <Button id='create-enrichment-button' type='submit' disabled={disableForm}>
                                    {showSpinner ?
                                        <Spinner animation="border" size="sm" />
                                        :
                                        <span>
                                            Créer un enrichissement
                                        </span>
                                    }
                                </Button>
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
        </div>
    )
}
