import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import EvaluationResponse from '../interfaces/EvaluationResponse';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import Enrichment from '../interfaces/Enrichment';
import Evaluation from '../interfaces/Evaluation';

interface EnrichmentControllerProps {
    enrichmentId: string,
}
interface CriteriaDetail {
    title: string,
    explanation: string
}
interface CriteriaDetails {
    [key : string]: CriteriaDetail
}

export default function ({enrichmentId} : EnrichmentControllerProps) {
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichment, setEnrichment] = useState<Enrichment>();
    const [currentMultipleChoiceQuestionIndex, setCurrentMultipleChoiceQuestionIndex] = useState<number>(0);
    const [showMultipleChoiceQuestionUserFeedbackModal, setShowMultipleChoiceQuestionUserFeedbackModal] = useState<boolean>(false);
    const [showMetadataUserFeedbackModal, setShowMetadataUserFeedbackModal] = useState<boolean>(false);
    const [showCriteriaModal, setShowCriteriaModal] = useState<boolean>(false);
    const [evaluation, setEvaluation] = useState<Evaluation>();
    const [temporaryThumbUp, setTemporaryThumbUp] = useState<boolean>();
    const [disableSumbitButton, setDisableSumbitButton] = useState<boolean>(false);
    const [modified, setModified] = useState<boolean>(false);

    const CRITERIA_EXPLANATION: CriteriaDetails = {
        is_question : {
            title: 'Question',
            explanation: 'La proposition est une question valide'
        },
        is_related: {
            title: 'Liée',
            explanation: 'La question est en relation avec la ressource'
        },
        is_self_contained : {
            title: 'Autonome',
            explanation: 'La réponse est dans la ressource'
        },
        language_is_clear : {
            title: 'Language',
            explanation: 'Le language est clair'
        },
        answers_are_all_different : {
            title: 'Réponses différentes',
            explanation: 'Les réponses sont différentes'
        },
        fake_answers_are_not_obvious : {
            title: 'Mauvaises Réponses',
            explanation: 'Les mauvaises réponses ne sont pas évidentes'
        },
        answers_are_related : {
            title: 'Réponses',
            explanation: 'Les réponses sont en relation avec la question'
        },
        quiz_about_concept : {
            title: 'Concept',
            explanation: 'La question concerne un concept '
        }
    }

    const toggleMultipleChoiceQuestionUserFeedbackModal = () => {
        setShowMultipleChoiceQuestionUserFeedbackModal(!showMultipleChoiceQuestionUserFeedbackModal);
    }

    const toggleMetadataUserFeedbackModal = () => {
        setShowMetadataUserFeedbackModal(!showMetadataUserFeedbackModal);
    }

    const toggleCriteriaModal = (inputEvalution?: Evaluation) => {
        if (inputEvalution) {
            setEvaluation(inputEvalution);
        }
        setShowCriteriaModal(!showCriteriaModal);
    }

    useEffect(() => {
        fetchLatestEnrichmentVersion();
        fetchEnrichment();
    }, []);

    const fetchEnrichment = () => {
        fetch(Routing.generate('app_get_enrichment', { enrichmentId }))
            .then(response => response.json())
            .then(data => {
                setEnrichment(data);
            })
    }

    const fetchLatestEnrichmentVersion = () => {
        fetch(Routing.generate('app_latest_enrichment_version', {enrichmentId}))
            .then(response => response.json())
            .then((data: EnrichmentVersion) => {
                setEnrichmentVersion(data);
            })
    }

    const updateMultipleChoiceQuestionFeedback = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        const userFeedback = event.target[0].value;
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].thumbUp = temporaryThumbUp;
        temporaryMCQs[currentMultipleChoiceQuestionIndex].userFeedback = userFeedback;
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
        toggleMultipleChoiceQuestionUserFeedbackModal();
    }

    const updateMetadataFeedback = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        const userFeedback = event.target[0].value;
        setEnrichmentVersion({...enrichmentVersion, enrichmentVersionMetadata: {...enrichmentVersion.enrichmentVersionMetadata, userFeedback}})
        setModified(true);
        toggleMetadataUserFeedbackModal();
    }

    const evaluateMultipleChoiceQuestion = (index: number, thumbUp: boolean) => {
        setCurrentMultipleChoiceQuestionIndex(index);
        toggleMultipleChoiceQuestionUserFeedbackModal();
        setTemporaryThumbUp(thumbUp);
    }

    const evaluateChoice = (mcqIndex: number, choiceIndex: number, thumbUp: boolean) => {        
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...enrichmentVersion.multipleChoiceQuestions[mcqIndex].choices
        ];
        temporaryChoices[choiceIndex].thumbUp = thumbUp;
        temporaryMCQs[mcqIndex].choices = temporaryChoices;
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }


    const evaluateMetadata = (property: string, thumbUp: boolean) => {
        setEnrichmentVersion({...enrichmentVersion, enrichmentVersionMetadata: {...enrichmentVersion.enrichmentVersionMetadata, [property]: thumbUp}})
        setModified(true);
    }

    const submitEnrichmentVersionEvaluation = () => {
        setDisableSumbitButton(true);
        fetch(Routing.generate('app_evaluate_enrichment_version', {
                enrichmentId: enrichmentId,
                versionId: enrichmentVersion.id
            }), {
                method: 'POST',
                body: JSON.stringify(enrichmentVersion)
            })
            .then(response => response.json())
            .then((_data: EvaluationResponse) => {
                setDisableSumbitButton(false);
                window.location.href = Routing.generate('app_enrichment', {enrichmentId});
            }
        )
    }

    const sortChoices = (firstChoice: Choice, secondChoice: Choice): number => {
        if (firstChoice.id === null) {
            return 1;
        } else if (secondChoice.id === null) {
            return -1
        }
        return firstChoice.id > secondChoice.id ? 1 : -1;
    }

    const sortMCQs = (firstMCQ: MultipleChoiceQuestion, secondMCQ: MultipleChoiceQuestion): number => {
        return firstMCQ.id > secondMCQ.id ? 1 : -1;
    }

    const evaluationColor = (evaluation: Evaluation) => {
        const criteriaCount = Object.keys(evaluation).length
        const respectedCriteriaNumber = Object.values(evaluation).filter(value => value === true).length;
        if (respectedCriteriaNumber <= criteriaCount / 4) {
            return 'danger';
        } else if (respectedCriteriaNumber <= criteriaCount / 2) {
            return 'warning';
        } else {
            return 'success';
        }
    }

    return (
        <div>
            {
                enrichmentVersion && enrichment?
                <div>
                    <div className='d-flex flex-column'>
                        <strong className='h2 mb-3'>Bienvenue sur la page d'évaluation de la version de l'enrichissement de {enrichment.media.originalFileName}</strong>
                        <div className='mb-2 small'>
                            Je suis Aristote, votre assistant, et voici les information et les questions que j’ai générées à partir de votre vidéo. Pouvez-vous évaluer leur pertinence en utilisant les pouces vers le haut ou le bas ? Cette évaluation me servira à m’améliorer pour vos futures demandes.
                        </div>
                        <div className='mb-4 small'>
                            Une fois l’évaluation terminée, vous pourrez passer à l’étape suivante pour modifier ces informations.
                        </div>
                        <div className='fw-bold h3'>
                            Métadonnées
                        </div>
                        <div className='d-flex'>
                            <i id='media-icon' className="fa-regular fa-circle-play p-5"></i>
                            <div className='d-flex flex-column justify-content-center p-3 bg-light rounded'>
                                <div className='d-flex justify-content-between'>
                                    <div className='me-2'>
                                        <strong>Titre : </strong> {enrichmentVersion.enrichmentVersionMetadata.title}
                                    </div>
                                    <div
                                        className='d-flex'
                                        key={`metadata-title-
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpTitle === true ? '-thumb-up' : ''}
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpTitle === false ? '-thumb-down': ''}
                                        `}
                                    >
                                        <div onClick={() => evaluateMetadata('thumbUpTitle', true)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpTitle === true ?
                                                <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                        <div onClick={() => evaluateMetadata('thumbUpTitle', false)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpTitle === false ?
                                                <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <div className='me-2'>
                                        <strong>Description : </strong> {enrichmentVersion.enrichmentVersionMetadata.description}
                                    </div>
                                    <div
                                        className='d-flex'
                                        key={`metadata-description-
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpDescription === true ? '-thumb-up' : ''}
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpDescription === false ? '-thumb-down': ''}
                                        `}
                                    >
                                        <div onClick={() => evaluateMetadata('thumbUpDescription', true)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpDescription === true ?
                                                <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                        <div onClick={() => evaluateMetadata('thumbUpDescription', false)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpDescription === false ?
                                                <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <div className='me-2'>
                                        <strong>Discipline : </strong> {enrichmentVersion.enrichmentVersionMetadata.discipline}
                                    </div>
                                    <div
                                        className='d-flex'
                                        key={`metadata-discipline-
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpDiscipline === true ? '-thumb-up' : ''}
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpDiscipline === false ? '-thumb-down': ''}
                                        `}
                                    >
                                        <div onClick={() => evaluateMetadata('thumbUpDiscipline', true)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpDiscipline === true ?
                                                <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                        <div onClick={() => evaluateMetadata('thumbUpDiscipline', false)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpDiscipline === false ?
                                                <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <div className='me-2'>
                                        <strong>Nature de média : </strong> {enrichmentVersion.enrichmentVersionMetadata.mediaType}
                                    </div>
                                    <div
                                        className='d-flex'
                                        key={`metadata-mediaType-
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpMediaType === true ? '-thumb-up' : ''}
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpMediaType === false ? '-thumb-down': ''}
                                        `}
                                    >
                                        <div onClick={() => evaluateMetadata('thumbUpMediaType', true)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpMediaType === true ?
                                                <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                        <div onClick={() => evaluateMetadata('thumbUpMediaType', false)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpMediaType === false ?
                                                <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <div className='me-2'>
                                        <strong>Sujets : </strong> {enrichmentVersion.enrichmentVersionMetadata.topics.join(', ')}
                                    </div>
                                    <div
                                        className='d-flex'
                                        key={`metadata-topics-
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpTopics === true ? '-thumb-up' : ''}
                                            ${enrichmentVersion.enrichmentVersionMetadata.thumbUpTopics === false ? '-thumb-down': ''}
                                        `}
                                    >
                                        <div onClick={() => evaluateMetadata('thumbUpTopics', true)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpTopics === true ?
                                                <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                        <div onClick={() => evaluateMetadata('thumbUpTopics', false)}>
                                            {enrichmentVersion.enrichmentVersionMetadata.thumbUpTopics === false ?
                                                <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                : 
                                                <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className='my-2'>
                                    <Button onClick={toggleMetadataUserFeedbackModal}>Ajouter un commentaire</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='fw-bold h3'>
                        QCM
                    </div>
                    <div className='table-striped mt-5'>
                        <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                            <thead>
                                <tr className="border-bottom text-center">
                                    <th className="border-end col-4">
                                        Question
                                    </th>
                                    <th className="border-end col-2">
                                        Critères respectés
                                    </th>
                                    <th className="border-end col-6">
                                        Réponses
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichmentVersion.multipleChoiceQuestions ? enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map((multipleChoiceQuestion, mcqIndex) => 
                                        <tr className="border-bottom" key={`question-row-${multipleChoiceQuestion.id}`}>
                                            <td className="border-end text-center">
                                                <div 
                                                    className='d-flex justify-content-center align-items-center'
                                                    key={`mcq-
                                                        ${multipleChoiceQuestion.id}
                                                        ${multipleChoiceQuestion.thumbUp === true ? '-thumb-up' : ''}
                                                        ${multipleChoiceQuestion.thumbUp === false ? '-thumb-down': ''}
                                                    `}
                                                >
                                                    <div className='me-3'>
                                                        {multipleChoiceQuestion.question}
                                                    </div>
                                                    <div onClick={() => evaluateMultipleChoiceQuestion(mcqIndex, true)}>
                                                        {multipleChoiceQuestion.thumbUp === true ?
                                                            <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                            : 
                                                            <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                                        }
                                                    </div>
                                                    <div onClick={() => evaluateMultipleChoiceQuestion(mcqIndex, false)}>
                                                        {multipleChoiceQuestion.thumbUp === false ? 
                                                            <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                            : 
                                                            <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                                        }
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-end text-center">
                                                {multipleChoiceQuestion.evaluation?
                                                    <Badge className='criteria-badge' bg={evaluationColor(multipleChoiceQuestion.evaluation)} role='button' onClick={() => toggleCriteriaModal(multipleChoiceQuestion.evaluation)}>
                                                        {Object.values(multipleChoiceQuestion.evaluation).filter(value => value === true).length} / {Object.keys(multipleChoiceQuestion.evaluation).length}
                                                    </Badge>
                                                    : '-'
                                                }
                                            </td>
                                            <td className="border-end text-center">
                                                <div className='d-flex flex-column'>
                                                    {multipleChoiceQuestion.choices? multipleChoiceQuestion.choices.sort(sortChoices).map((choice, choiceIndex) => 
                                                            <div 
                                                                key={`choice-
                                                                    ${choice.id}
                                                                    ${choice.thumbUp === true ? '-thumb-up' : ''}
                                                                    ${choice.thumbUp === false ? '-thumb-down': ''}`
                                                                }
                                                                className='d-flex align-items-center'
                                                            >
                                                                <i className={`me-2 ${choice.correctAnswer? 'fa-solid fa-check text-success' : 'fa-solid fa-xmark text-danger'}`}></i>
                                                                <Badge
                                                                    key={`choice-${choice.id}`}
                                                                    bg='light'
                                                                    className='my-2 me-2 flex-grow-1 text-dark text-wrap'

                                                                >
                                                                    {choice.optionText}
                                                                </Badge>

                                                                <div onClick={() => evaluateChoice(mcqIndex, choiceIndex, true)}>
                                                                {choice.thumbUp === true ?
                                                                    <i className="fa-solid fa-thumbs-up me-3 thumb-gray fa-xl" role='button'></i>
                                                                    : 
                                                                    <i className="fa-regular fa-thumbs-up me-3 thumb-gray fa-lg" role='button'></i>
                                                                }
                                                                </div>
                                                                <div onClick={() => evaluateChoice(mcqIndex, choiceIndex, false)}>
                                                                {choice.thumbUp === false ?
                                                                    <i className="fa-solid fa-thumbs-down me-3 thumb-gray fa-xl" role='button'></i>
                                                                    : 
                                                                    <i className="fa-regular fa-thumbs-down me-3 thumb-gray fa-lg" role='button'></i>
                                                                }
                                                                </div>
                                                            </div>
                                                        )
                                                    : null}
                                                </div>
                                            </td>
                                        </tr>

                                    ): null
                                }
                            </tbody>
                        </table>
                    </div>

                    <Modal show={showMultipleChoiceQuestionUserFeedbackModal} onHide={toggleMultipleChoiceQuestionUserFeedbackModal} size='lg'>
                        <Modal.Header closeButton>
                            <Modal.Title>Merci pour votre feedback</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={updateMultipleChoiceQuestionFeedback}>
                                <Form.Group className="mb-3" controlId="userFeedback">
                                    <Form.Label>
                                        Vous pouvez ajouter un commentaire si vous voulez :
                                    </Form.Label>
                                    <Form.Control as="textarea" rows={3} />
                                </Form.Group>
                                <div className='d-flex justify-content-end'>
                                    <Button type='submit'>
                                        Confirmer
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>

                    <Modal show={showMetadataUserFeedbackModal} onHide={toggleMetadataUserFeedbackModal} size='lg'>
                        <Modal.Header closeButton>
                            <Modal.Title>Comment puis-je m'améliorer ?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={updateMetadataFeedback}>
                                <Form.Group className="mb-3" controlId="userFeedback">
                                    <Form.Label>
                                        Vous pouvez écrire votre commentaire ici :
                                    </Form.Label>
                                    <Form.Control as="textarea" rows={3} />
                                </Form.Group>
                                <div className='d-flex justify-content-end'>
                                    <Button id='send-feedback-button' type='submit'>
                                        Confirmer
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>

                    <Modal show={showCriteriaModal} onHide={toggleCriteriaModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Détail des critères d'évaluation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {evaluation?
                                <div>
                                    <div>
                                        {Object.entries(evaluation).map(criteria => 
                                                <div key={`criteria-${criteria[0]}`} className='d-flex align-items-center'>
                                                    <i className={`me-2 fa-solid fa-circle-${criteria[1] ? 'check': 'xmark'} text-${criteria[1] ? 'success': 'danger'}`}></i>
                                                    <div>
                                                        <strong className='fw-bold'>{CRITERIA_EXPLANATION[criteria[0]]?.title ?? criteria[0]} :</strong> {CRITERIA_EXPLANATION[criteria[0]]?.explanation ?? '-' }
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <div className='d-flex justify-content-end'>
                                        <Button onClick={() => toggleCriteriaModal()} variant='secondary'>
                                            Fermer
                                        </Button>
                                    </div>
                                </div>
                                : null
                            }
                        </Modal.Body>
                    </Modal>
                    <div className='d-flex flex-column'>
                        <div className='mt-4 align-self-end'>
                                <Button onClick={submitEnrichmentVersionEvaluation} disabled={disableSumbitButton || !modified}>
                                    {disableSumbitButton ?
                                        <Spinner animation="border" size="sm" />
                                            :
                                        <span>
                                            Soumettre l'évaluation
                                        </span>
                                    }
                                </Button>
                            </div>
                    </div>
                </div>
                : null
            }
            
        </div>
    )
}
