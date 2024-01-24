import moment from 'moment';
import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import Enrichments from '../interfaces/Enrichments';

interface EnrichmentsListProps {
    enrichments: Enrichments
}

const STATUS_TRANSLATION = {
    WAITING_MEIDA_UPLOAD: 'En attente de téléversement',
    UPLOADING_MEDIA: 'En cours de téléversement',
    TRANSCRIBING_MEDIA: 'En cours de transcription',
    WAITING_MEDIA_TRANSCRIPTION: 'En attente de transcription',
    WAITING_AI_ENRICHMENT: "En attente de l'enrichissement",
    AI_ENRICHING: "En cours d'enrichissement",
    WAITING_AI_EVALUATION: "En attente d'évaluation",
    AI_EVALUATING: "En cours d'évaluation",
    SUCCESS: 'Succès',
    FAILURE: 'Erreur'
}

export default function ({enrichments}: EnrichmentsListProps) {
    moment.locale('fr');
    return (
        <div className='table-responsive'>
            <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                <thead>
                    <tr className="border-bottom text-center">
                        <th className="border-end col-4">
                            Nom du fichier
                        </th>
                        <th className="border-end col-4">
                            Status
                        </th>
                        <th className="border-end col-3">
                            Actions
                        </th>
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
                                            <Button href={'enrichments/'+enrichment.id} title='Edit'>Accéder</Button> 
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
