import moment from 'moment';
import React, { useState } from 'react';
import { Badge, Button, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';
import Routing from '../../Routing';
import Enrichment from '../interfaces/Enrichment';
import Enrichments from '../interfaces/Enrichments';

interface EnrichmentsListProps {
    enrichments: Enrichments,
    fetchEnrichments: Function
}

const STATUS_TRANSLATION = {
    WAITING_MEIDA_UPLOAD: 'En attente de téléversement',
    UPLOADING_MEDIA: 'En cours de téléversement',
    WAITING_MEDIA_TRANSCRIPTION: 'En attente de transcription',
    TRANSCRIBING_MEDIA: 'En cours de transcription',
    WAITING_AI_ENRICHMENT: "En attente de l'enrichissement",
    AI_ENRICHING: "En cours d'enrichissement",
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

export default function ({enrichments, fetchEnrichments}: EnrichmentsListProps) {
    moment.locale('fr');
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
    const [disableDeleteButton, setDisableDeleteButton] = useState<boolean>(false);
    const [currentEnrichment, setCurrentEnrichment] = useState<Enrichment>(null);
    
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
                    {enrichments ? enrichments.content.map(enrichment => 
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
                                <td className="border-end text-center">
                                    {
                                        enrichment.status === 'SUCCESS' ? 
                                            <Button href={'enrichments/'+enrichment.id}>Voir</Button> 
                                            : null
                                    }
                                    <Button className='ms-2' onClick={() => toggleDeleteModal(enrichment)}>Supprimer</Button>
                                </td>
                            </tr>
                        ): null
                    }
                </tbody>
            </table>
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
