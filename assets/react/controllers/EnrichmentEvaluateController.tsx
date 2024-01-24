import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import EvaluationResponse from '../interfaces/EvaluationResponse';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';

interface EnrichmentControllerProps {
    enrichmentId: string,
}

export default function ({enrichmentId} : EnrichmentControllerProps) {
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [currentMultipleChoiceQuestionIndex, setCurrentMultipleChoiceQuestionIndex] = useState<number>(0);
    const [showMultipleChoiceQuestionUserFeedbackModal, setShowMultipleChoiceQuestionUserFeedbackModal] = useState<boolean>(false);
    const [showMetadataUserFeedbackModal, setShowMetadataUserFeedbackModal] = useState<boolean>(false);
    const [temporaryThumbUp, setTemporaryThumbUp] = useState<boolean>();
    const [disableSumbitButton, setDisableSumbitButton] = useState<boolean>(false);
    const [modified, setModified] = useState<boolean>(false);

    const toggleMultipleChoiceQuestionUserFeedbackModal = () => {
        setShowMultipleChoiceQuestionUserFeedbackModal(!showMultipleChoiceQuestionUserFeedbackModal);
    }

    const toggleMetadataUserFeedbackModal = () => {
        setShowMetadataUserFeedbackModal(!showMetadataUserFeedbackModal);
    }

    useEffect(() => {
        fetchLatestEnrichmentVersion();
    }, []);

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

    return (
        <div>
            {
                enrichmentVersion?
                <div>
                    <div className='d-flex flex-column'>

                        <div className='d-flex align-items-center mb-4'>
                            <strong className='h3'>Bienvenue à la page d'évaluation de la version d'enrichment générée par Aristote !</strong>
                        </div>
                        <div className='d-flex'>
                            <div className='me-2'>
                                <strong>Titre : </strong>
                            </div>
                            <div className='me-2'>
                                {enrichmentVersion.enrichmentVersionMetadata.title}
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
                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                    }
                                </div>
                                <div onClick={() => evaluateMetadata('thumbUpTitle', false)}>
                                    {enrichmentVersion.enrichmentVersionMetadata.thumbUpTitle === false ?
                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='d-flex'>
                            <div className='me-2'>
                                <strong>Description : </strong>
                            </div>
                            <div className='me-2'>
                                {enrichmentVersion.enrichmentVersionMetadata.description}
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
                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                    }
                                </div>
                                <div onClick={() => evaluateMetadata('thumbUpDescription', false)}>
                                    {enrichmentVersion.enrichmentVersionMetadata.thumbUpDescription === false ?
                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='d-flex'>
                            <div className='me-2'>
                                <strong>Discipline : </strong>
                            </div>
                            <div className='me-2'>
                                {enrichmentVersion.enrichmentVersionMetadata.discipline}
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
                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                    }
                                </div>
                                <div onClick={() => evaluateMetadata('thumbUpDiscipline', false)}>
                                    {enrichmentVersion.enrichmentVersionMetadata.thumbUpDiscipline === false ?
                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='d-flex'>
                            <div className='me-2'>
                                <strong>Type de média : </strong>
                            </div>
                            <div className='me-2'>
                                {enrichmentVersion.enrichmentVersionMetadata.mediaType}
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
                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                    }
                                </div>
                                <div onClick={() => evaluateMetadata('thumbUpMediaType', false)}>
                                    {enrichmentVersion.enrichmentVersionMetadata.thumbUpMediaType === false ?
                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='d-flex'>
                            <div className='me-2'>
                                <strong>Topics : </strong>
                            </div>
                            <div className='me-2'>
                                {enrichmentVersion.enrichmentVersionMetadata.topics.join(', ')}
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
                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                    }
                                </div>
                                <div onClick={() => evaluateMetadata('thumbUpTopics', false)}>
                                    {enrichmentVersion.enrichmentVersionMetadata.thumbUpTopics === false ?
                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                        : 
                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Button onClick={toggleMetadataUserFeedbackModal}>J'ai un commentaire conceranant les métadonnées</Button>
                        </div>
                        {/* <div className='my-2'>
                            <Button variant='secondary' className='me-3' onClick={downloadTranscript}>Télécharger le transcript</Button>
                            <Button variant='secondary' onClick={downloadMultipleChoiceQuestions}>Télécharger les QCMs</Button>
                        </div> */}
                        {/* <div className='my-2 align-self-end'>
                            <Button onClick={submitEnrichmentVersionEvaluation} disabled={disableSumbitButton || !modified}>
                                {disableSumbitButton ?
                                    <Spinner animation="border" size="sm" />
                                        :
                                    <span>
                                        Soumettre l'évaluation
                                    </span>
                                }
                            </Button>
                        </div> */}
                    </div>

                    <div className='table-responsive table-striped mt-5'>
                        <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                            <thead>
                                <tr className="border-bottom text-center">
                                    <th style={{width: '400px'}} className="border-end">
                                        Question
                                    </th>
                                    <th style={{width: '300px'}} className="border-end">
                                        Evaluation automatique
                                    </th>
                                    <th className="border-end">
                                        Réponses
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichmentVersion.multipleChoiceQuestions ? enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map((multipleChoiceQuestion, mcqIndex) => 
                                        <tr className="border-bottom" key={`question-row-${multipleChoiceQuestion.id}`}>
                                            <td className="border-end text-center">
                                                <div 
                                                    className='d-flex justify-content-center'
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
                                                            <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                                            : 
                                                            <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                                        }
                                                    </div>
                                                    <div onClick={() => evaluateMultipleChoiceQuestion(mcqIndex, false)}>
                                                        {multipleChoiceQuestion.thumbUp === false ? 
                                                            <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                                            : 
                                                            <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                                        }
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-end text-center">
                                                <div className='d-flex flex-column'>
                                                    {multipleChoiceQuestion.evaluation? Object.keys(multipleChoiceQuestion.evaluation).map((criteria, index) => 
                                                        <div key={`criteria-${index}`}>
                                                            <Badge bg={multipleChoiceQuestion.evaluation[criteria] ? 'success' : 'danger'} className='my-2'>
                                                                {criteria}
                                                            </Badge>
                                                        </div>
                                                    )
                                                    : null
                                                    }
                                                </div>
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
                                                                    className='my-2 me-2 flex-grow-1 text-dark'
                                                                >
                                                                    {choice.optionText}
                                                                </Badge>

                                                                <div onClick={() => evaluateChoice(mcqIndex, choiceIndex, true)}>
                                                                {choice.thumbUp === true ?
                                                                    <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                                                    : 
                                                                    <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                                                }
                                                                </div>
                                                                <div onClick={() => evaluateChoice(mcqIndex, choiceIndex, false)}>
                                                                {choice.thumbUp === false ?
                                                                    <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                                                    : 
                                                                    <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
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
                            <Modal.Title>Un commentaire conceranant les métadonnées ?</Modal.Title>
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
                    </div>
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
