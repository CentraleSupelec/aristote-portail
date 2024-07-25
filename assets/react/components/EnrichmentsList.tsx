import moment from 'moment';
import React, { BaseSyntheticEvent, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';
import Routing from '../../Routing';
import AiModelInfrastructureCombination from '../interfaces/AiModelInfrastructureCombination';
import Enrichment from '../interfaces/Enrichment';
import Enrichments from '../interfaces/Enrichments';
import SelectOption from '../interfaces/SelectOption';
import makeAnimated from "react-select/animated";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { AVAILABLE_AIS, MEDIA_TYPES, NOTIFICATION_URL } from '../constants';

interface EnrichmentsListProps {
    enrichments: Enrichments,
    fetchEnrichments: Function,
    aiModelInfrastructureCombinations: AiModelInfrastructureCombination[],
}

const STATUS_TRANSLATION = {
    WAITING_MEIDA_UPLOAD: 'En attente de téléversement',
    UPLOADING_MEDIA: 'En cours de téléversement',
    WAITING_MEDIA_TRANSCRIPTION: 'En attente de transcription',
    TRANSCRIBING_MEDIA: 'En cours de transcription',
    WAITING_AI_ENRICHMENT: "En attente de l'enrichissement",
    AI_ENRICHING: "En cours d'enrichissement",
    WAITING_TRANSLATION: "En attente de traduction",
    TRANSLATING: "En cours de traduction",
    WAITING_AI_EVALUATION: "En attente d'évaluation",
    AI_EVALUATING: "En cours d'évaluation",
    SUCCESS: 'Succès',
    FAILURE: 'Erreur'
}
interface Step {
    field: string,
    startDateField: string,
    endDateField: string,
    label: string
}
const STEPS: Step[] = [
    {field: 'transcribedBy', startDateField: 'transribingStartedAt', endDateField: 'transribingEndedAt', label: 'Transcrit par :'},
    {field: 'aiProcessedBy', startDateField: 'aiEnrichmentStartedAt', endDateField: 'aiEnrichmentEndedAt', label: 'Enrichi par :'},
    {field: 'aiEvaluatedBy', startDateField: 'aiEvaluationStartedAt', endDateField: 'aiEvaluationEndedAt',label: 'Evalué par :'},
    {field: 'translatedBy', startDateField: 'translationStartedAt', endDateField: 'translationEndedAt',label: 'Traduit par :'},
]

const renderTooltip = (props: OverlayInjectedProps) => (
    <Tooltip id="status-tooltip" {...props}>
        <div className='d-flex flex-column'>
            <div className='fw-bold text-start ms-2 mb-1'>
                Liste des statuts
            </div>
            <ul>
                {Object.values(STATUS_TRANSLATION).map((status, index) => <li key={`status-${index}`} className='text-start'>{status}</li>)}
            </ul>
        </div>
    </Tooltip>
);

export default function ({enrichments, fetchEnrichments, aiModelInfrastructureCombinations}: EnrichmentsListProps) {
    moment.locale('fr');
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
    const [disableDeleteButton, setDisableDeleteButton] = useState<boolean>(false);
    const [currentEnrichment, setCurrentEnrichment] = useState<Enrichment>(null);

    const animatedComponents = makeAnimated();
    const [selectedMediaTypes, setSelectedMediaTypes] = useState<SelectOption[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<SelectOption[]>([]);
    const [selectedAiModelInfrastructureCombination, setSelectedAiModelInfrastructureCombination] = useState<AiModelInfrastructureCombination>();
    const [selectedEvaluationAi, setSelectedEvaluationAi] = useState<SelectOption>();
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    
    const toggleRegenerateModal = (enrichissementIndex?: number) => {
        if (undefined !== enrichissementIndex) {
            setCurrentEnrichment(enrichments.content[enrichissementIndex]);
            setSelectedDisciplines(enrichments.content[enrichissementIndex].disciplines.map(discipline => ({label: discipline, value: discipline})))
            setSelectedMediaTypes(enrichments.content[enrichissementIndex].mediaTypes.map(discipline => ({label: discipline, value: discipline})))
            setSelectedEvaluationAi({value: enrichments.content[enrichissementIndex].aiEvaluation, label: enrichments.content[enrichissementIndex].aiEvaluation})
        }
        setShowModal(!showModal);
    };

    const onMediaTypesChange = (newValue: SelectOption[]) => {
        setSelectedMediaTypes(newValue);
    }

    const onDisciplinesChange = (newValue: SelectOption[]) => {
        setSelectedDisciplines(newValue);
    }

    const onAiChange = (newValue: SelectOption) => {
        setSelectedEvaluationAi(newValue);
    }

    const onAiModelInfrastructureCombinationChange = (newValue: AiModelInfrastructureCombination) => {
        setSelectedAiModelInfrastructureCombination(newValue);
    }

    const getValue = (aiModelInfrastructureCombination: AiModelInfrastructureCombination) => {
        return aiModelInfrastructureCombination.aiModel + '@' + aiModelInfrastructureCombination.infrastructure
    }


    const regenerateAiEnrichment = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        setDisableForm(true);
        setShowAlert(false);
        const enrichmentParameters = {
            mediaTypes: selectedMediaTypes.map(mediaType => mediaType.value),
            disciplines: selectedDisciplines.map(discipline => discipline.value),
        }
        if (selectedEvaluationAi) {
            enrichmentParameters['aiEvaluation'] = selectedEvaluationAi.value;
        }

        enrichmentParameters['aiModel'] = null;
        enrichmentParameters['infrastructure'] = null;

        if (selectedAiModelInfrastructureCombination) {
            enrichmentParameters['aiModel'] = selectedAiModelInfrastructureCombination.aiModel;
            enrichmentParameters['infrastructure'] = selectedAiModelInfrastructureCombination.infrastructure;
        }

        fetch(Routing.generate('app_create_new_ai_enrichment', {enrichmentId: currentEnrichment.id}), {
            method: 'POST',
            body: JSON.stringify({
                notificationWebhookUrl: NOTIFICATION_URL + Routing.generate('app_enrichment_notification'),
                enrichmentParameters
            })
        })
        .then(response => {
                if (response.status === 200) {
                    fetchEnrichments();
                    setDisableForm(false);
                    toggleRegenerateModal();
                } else {
                    setDisableForm(false);
                    setShowAlert(true);
                }
            }
        )
    }

    const toggleDeleteModal = (enrichment?: Enrichment) => {
        if (enrichment) {
            setCurrentEnrichment(enrichment);
        } else {
            setCurrentEnrichment(null);
        }
        setShowDeleteModal(!showDeleteModal);
    }

    const toggleStatusModal = (enrichment?: Enrichment) => {
        if (enrichment) {
            setCurrentEnrichment(enrichment);
        } else {
            setCurrentEnrichment(null);
        }
        setShowStatusModal(!showStatusModal);
    }

    const deleteEnrichment = () => {
        setDisableDeleteButton(true);
        fetch(Routing.generate('app_delete_enrichment', { enrichmentId: currentEnrichment.id, }), {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(() => {
                fetchEnrichments();
                setDisableDeleteButton(false);
                toggleDeleteModal();
            }
            )
    }

    return (
        <div className='table-responsive'>
            {enrichments?.content.length?
                <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                    <thead>
                        <tr className="border-bottom text-center">
                            <th className="border-end col-4 fw-bold">
                                Nom du fichier
                            </th>
                            <th className="border-end col-4">
                                <div className='d-flex align-items-center justify-content-center'>
                                    <div className='pe-2'>
                                        Statut
                                    </div>
                                    <OverlayTrigger
                                        placement="right"
                                        delay={{ show: 400, hide: 1500 }}
                                        overlay={renderTooltip}
                                    >
                                        <div>
                                            <i className="fa-solid fa-circle-info text-secondary"></i>
                                        </div>
                                    </OverlayTrigger>
                                </div>
                            </th>
                            <th className="border-end col-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrichments ? enrichments.content.map((enrichment, index) => 
                                <tr className="border-bottom" key={`enrichment-row-${enrichment.id}`}>
                                    <td className="border-end text-center enrichment-id">
                                        {enrichment.media ? 
                                            enrichment.media.originalFileName + ' déposé le ' + moment(enrichment.createdAt).format('DD/MM/YYYY à HH:mm')
                                            :
                                            '-'
                                        }
                                    </td>
                                    <td className="border-end text-center">
                                        <Badge
                                            role='button'
                                            bg={enrichment.status === 'SUCCESS' ? 'success': enrichment.status === 'FAILURE'? 'danger': 'warning'}
                                            className='my-2'
                                            onClick={() => toggleStatusModal(enrichment)}
                                        >
                                            {STATUS_TRANSLATION[enrichment.status]}
                                        </Badge>
                                    </td>
                                    <td className="border-end">
                                        <div className='d-flex flex-column flex-lg-row justify-content-center align-items-center'>
                                            {
                                                enrichment.status === 'SUCCESS' ? 
                                                    <>
                                                        <Button className='mb-2 mb-lg-0' href={'enrichments/'+enrichment.id}>Voir</Button> 
                                                        <Button className='ms-2 mb-2 mb-lg-0' onClick={() => toggleRegenerateModal(index)}>Regénérer</Button> 
                                                    </>
                                                    : null
                                            }
                                            <Button className='ms-2' onClick={() => toggleDeleteModal(enrichment)}>Supprimer</Button>
                                        </div>
                                    </td>
                                </tr>
                            ): null
                        }
                    </tbody>
                </table>
                :
                <div className='d-flex flex-column'>
                    <div className='pb-4'>
                        Bienvenue sur l'assistant AristoQuiz.
                    </div>
                    <div>
                        Pour obtenir un quiz généré par l'IA Aristote, envoyez une vidéo en cliquant sur le bouton "Créer un enrichissement".
                    </div>
                </div>
            }
            <Modal show={showDeleteModal} onHide={toggleDeleteModal}>
                <Modal.Header closeButton>
                <Modal.Title>Supprimer l'enrichissement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Êtes vous sûr de vouloir supprimer l'enrichissement ?
                </Modal.Body>
                <Modal.Footer className='d-flex'>
                    <div className='justify-content-end'>
                        <Button className='me-3' onClick={() => toggleDeleteModal()} variant='secondary'>Annuler</Button>
                        <Button onClick={() => deleteEnrichment()} disabled={disableDeleteButton} variant='danger'>
                            {disableDeleteButton ?
                                <Spinner animation="border" size="sm" />
                                :
                                <span>
                                    Supprimer
                                </span>
                            }
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
            <Modal show={showModal} onHide={toggleRegenerateModal} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Regénérer l'enrichissement par IA</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {showAlert?
                        <Alert variant='danger' dismissible>
                            Une erreur s'est produite. Veuillez réessayer.
                        </Alert>
                        : null
                    }
                    <Form onSubmit={regenerateAiEnrichment}>
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
                        <Form.Group className="mb-3" controlId="mediaUpload.aiEvaluation">
                            <Form.Label>IA d'évaluation</Form.Label>
                            <Select
                                className='mb-3'
                                components={animatedComponents}
                                options={AVAILABLE_AIS}
                                placeholder="Choisissez l'IA qui évaluera la proposition d'Aristote"
                                onChange={onAiChange}
                                isClearable
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="mediaUpload.disciplines">
                            <Form.Label className='mb-1'>Disciplines</Form.Label>
                            <div className='text-black-50 small mb-2'>
                                Aristote choisira la discipline principale de votre média parmi la liste que vous lui proposez
                            </div>
                            <CreatableSelect
                                className='mb-3'
                                components={animatedComponents}
                                isMulti
                                placeholder='Mathématiques, Sociologie, Chimie, ...'
                                onChange={onDisciplinesChange}
                                value={selectedDisciplines}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="mediaUpload.mediaTypes">
                            <Form.Label className='mb-1'>Nature du média</Form.Label>
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
                                value={selectedMediaTypes}
                            />
                        </Form.Group>
                        <div className='d-flex justify-content-end'>
                            <Button id='create-enrichment-button' type='submit' disabled={disableForm}>
                                {disableForm ?
                                    <Spinner animation="border" size="sm" />
                                    :
                                    <span>
                                        Regénérer
                                    </span>
                                }
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
            {currentEnrichment?
                <Modal show={showStatusModal} onHide={toggleStatusModal} size='lg'>
                    <Modal.Header closeButton>
                    <Modal.Title>Informations sur le déroulement de l'enrichissement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            <div className='d-flex mb-2'>
                                <div className='me-2 fw-bold text-nowrap'>
                                    ID :
                                </div>
                                <div>
                                    {currentEnrichment.id}
                                </div>
                            </div>
                            {STEPS.map(step =>
                                currentEnrichment[step.field]?
                                    <div className='d-flex mb-2' key={`step-${step.field}`}>
                                        <div className='me-2 fw-bold text-nowrap'>
                                            {step.label}
                                        </div>
                                        <div>
                                            {currentEnrichment[step.field].name} de {moment(currentEnrichment[step.startDateField]).format('DD/MM/YYYY à HH:mm')} à {currentEnrichment[step.endDateField]? moment(currentEnrichment[step.endDateField]).format('DD/MM/YYYY à HH:mm'): '_____'}
                                        </div>
                                    </div>
                                    : null
                            )}
                            {currentEnrichment.failureCause?
                                <div className='d-flex'>
                                    <div className='me-2 fw-bold text-nowrap'>
                                        Erreur :
                                    </div>
                                    <div>
                                        {currentEnrichment.failureCause}
                                    </div>
                                </div>
                                : null
                            }

                        </div>
                    </Modal.Body>
                </Modal>
                :
                null
            }
        </div>
    )
}
