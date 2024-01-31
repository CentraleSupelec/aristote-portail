import moment from 'moment';
import React from 'react';
import { Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';
import Enrichments from '../interfaces/Enrichments';

interface EnrichmentsListProps {
    enrichments: Enrichments
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

export default function ({enrichments}: EnrichmentsListProps) {
    moment.locale('fr');

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
                                    delay={{ show: 250, hide: 999999 }}
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
                                    {enrichment.media.originalFileName} déposé le {moment(enrichment.createdAt).format('DD/MM/YYYY à H:m')}
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
                                            <Button href={'enrichments/'+enrichment.id} title='Edit'>Voir</Button> 
                                            : null
                                    }
                                </td>
                            </tr>
                        ): null
                    }
                </tbody>
            </table>
        </div>
    )
}
