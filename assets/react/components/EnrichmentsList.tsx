import moment from 'moment';
import React, { useState } from 'react';
import { Badge, Button, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';
import Routing from '../../Routing';
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
    const [disableDeleteButton, setDisableDeleteButton] = useState<boolean>(false);
    const [currentEnrichmentId, setCurrentEnrichmentId] = useState<string>(null);
    
    const toggleDeleteModal = (enrichmentId?: string) => {
        if (enrichmentId) {
            setCurrentEnrichmentId(enrichmentId);
        } else {
            setCurrentEnrichmentId(null);
        }
        setShowDeleteModal(!showDeleteModal);
    }

    const deleteEnrichment = () => {
        setDisableDeleteButton(true);
        fetch(Routing.generate('app_delete_enrichment', { enrichmentId: currentEnrichmentId, }), {
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
                                    delay={{ show: 250, hide: 400 }}
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
                                        bg={enrichment.status === 'SUCCESS' ? 'success': enrichment.status === 'FAILURE'? 'danger': 'warning'}
                                        className='my-2'
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
                                    <Button className='ms-2' onClick={() => toggleDeleteModal(enrichment.id)}>Supprimer</Button>
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
        </div>
    )
}
