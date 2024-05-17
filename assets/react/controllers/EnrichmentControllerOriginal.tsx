import React, { BaseSyntheticEvent, ChangeEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Badge, Button, Carousel, Form, Modal, Spinner } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import EvaluationResponse from '../interfaces/EvaluationResponse';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import EnrichmentVersions from '../interfaces/EnrichmentVersions';

interface EnrichmentControllerProps {
    enrichmentId: string,
}

export default function ({enrichmentId} : EnrichmentControllerProps) {
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichmentVersions, setEnrichmentVersions] = useState<EnrichmentVersion[]>([]);
    const [currentMultipleChoiceQuestionIndex, setCurrentMultipleChoiceQuestionIndex] = useState<number>(0);
    const [show, setShow] = useState<boolean>(false);
    const [showUserFeedbackModal, setShowUserFeedbackModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [disableUserFeedbackForm, setDisableUserFeedbackForm] = useState<boolean>(false);
    const [temporaryThumbUp, setTemporaryThumbUp] = useState<boolean>();
    const [modified, setModified] = useState<boolean>(false);
    
    const toggleModal = (multipleChoiceQuestionIndex?: number) => {
        if (multipleChoiceQuestionIndex !== undefined) {
            setCurrentMultipleChoiceQuestionIndex(multipleChoiceQuestionIndex);
        }
        setShow(!show);
    }

    const toggleUserFeedbackModal = () => {
        setShowUserFeedbackModal(!showUserFeedbackModal);
    }

    const toggleEditModal = (multipleChoiceQuestionIndex?: number) => {
        if (multipleChoiceQuestionIndex !== undefined) {
            setCurrentMultipleChoiceQuestionIndex(multipleChoiceQuestionIndex);
        }
        setShowEditModal(!showEditModal);
    }

    useEffect(() => {
        fetchLatestEnrichmentVersion();
        fetchEnrichmentVersions();
    }, []);

    const fetchLatestEnrichmentVersion = () => {
        fetch(Routing.generate('app_latest_enrichment_version', {enrichmentId}))
            .then(response => response.json())
            .then(data => {
                setEnrichmentVersion(data);
                setModified(false);
            })
    }

    const fetchEnrichmentVersions = () => {
        fetch(Routing.generate('app_get_enrichment_versions', {enrichmentId}))
            .then(response => response.json())
            .then((data: EnrichmentVersions) => {
                setEnrichmentVersions(data.content);
            })
    }

    const fetchVersionById = (versionId: string) => {
        fetch(Routing.generate('app_get_enrichment_version', {enrichmentId, versionId}))
            .then(response => response.json())
            .then((data: EnrichmentVersion) => {
                setEnrichmentVersion(data);
            })
    }

    const downloadTranscript = () => {
        downloadJsonObject(enrichmentVersion.transcript, 'trasncript_' + enrichmentVersion.id);
    };

    const downloadMultipleChoiceQuestions = () => {
        downloadJsonObject(enrichmentVersion.multipleChoiceQuestions, 'multiple_choice_questions_' + enrichmentVersion.id);
    };

    const downloadJsonObject = (object: Object, fileName: string) => {
        const jsonString = JSON.stringify(object, null, 2);
    
        const blob = new Blob([jsonString], { type: 'application/json' });
    
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        
        downloadLink.download = fileName + '.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const sendMultipleChoiceQuestionFeedback = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        setDisableUserFeedbackForm(true);
        const userFeedback = event.target[0].value;

        fetch(Routing.generate('app_evaluate_mcq', {
                enrichmentId: enrichmentId,
                versionId: enrichmentVersion.id,
                mcqId: enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].id,
            }), {
                method: 'POST',
                body: JSON.stringify({
                    thumbUp: temporaryThumbUp,
                    userFeedback: userFeedback !== '' ? userFeedback : null,
                })
            })
            .then(response => response.json())
            .then((data: EvaluationResponse) => {
                setEnrichmentVersion(data.enrichmentVersion);
                setDisableUserFeedbackForm(false);
                toggleUserFeedbackModal();
            }
        )
    }

    const evaluateMultipleChoiceQuestion = (thumbUp: boolean) => {
        toggleUserFeedbackModal();
        setTemporaryThumbUp(thumbUp);
    }

    const evaluateChoice = (choiceId: string, thumbUp: boolean) => {
        fetch(Routing.generate('app_evaluate_choice', {
                enrichmentId: enrichmentId,
                versionId: enrichmentVersion.id,
                mcqId: enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].id,
                choiceId
            }), {
                method: 'POST',
                body: JSON.stringify({
                    thumbUp
                })
            })
            .then(response => response.json())
            .then((data: EvaluationResponse) => {
                setEnrichmentVersion(data.enrichmentVersion);
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

    const updateChoiceCorrectAnswer = (choiceIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices
        ];
        temporaryChoices.forEach(choice => choice.correctAnswer = false);
        temporaryChoices[choiceIndex].correctAnswer = true;
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const addOption = () => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let newChoice: Choice = {
            id: null,
            optionText: '',
            correctAnswer: false,
            thumbUp: null
        }
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices.push(newChoice);
        let newEnrichmentVersion: EnrichmentVersion = {...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs};
        setEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const removeOption = (choiceIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [...enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices];
        temporaryChoices.splice(choiceIndex, 1);
        if (enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices[choiceIndex].correctAnswer) {
            temporaryChoices[0].correctAnswer = true;
        }
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        let newEnrichmentVersion: EnrichmentVersion = {...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs};
        setEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const createNewVersion = () => {
        const params = new FormData();
        params.append('multipleChoiceQuestions', JSON.stringify(enrichmentVersion.multipleChoiceQuestions));
        params.append('enrichmentVersionMetadata', JSON.stringify(enrichmentVersion.enrichmentVersionMetadata));
        fetch(Routing.generate('app_create_enrichment_version', {enrichmentId: enrichmentId,}), {
                method: 'POST',
                body: params
            })
            .then(response => response.json())
            .then((data: EvaluationResponse) => {
                fetchLatestEnrichmentVersion();
                setModified(false);
            }
        )
    }

    const updateChoiceText = (choiceIndex: number, value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices
        ];
        temporaryChoices[choiceIndex].optionText = value.target['value'];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const updateQuestion = (value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].question = value.target['value'];
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const updateExplanation = (value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].explanation = value.target['value'];
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    return (
        <div>
            {
                enrichmentVersion?
                <div>
                    <div className='d-flex flex-column'>
                        {enrichmentVersion.initialVersion? 
                            <div className='d-flex align-items-center'>
                                <strong>Date de la dernière évaluation :&nbsp;</strong>
                                <div className='me-2'>
                                    {enrichmentVersion.lastEvaluationDate ?? "Pas d'évaluation effectuée"}
                                </div>
                                <div>
                                    <Button onClick={downloadMultipleChoiceQuestions}>Soumettre une évaluation</Button>
                                </div>
                            </div>
                            : null
                        }
                        <div>
                            <strong>Versions : </strong>
                            {enrichmentVersions.map((eV, index) => 
                                <Badge bg={eV.id === enrichmentVersion.id ? 'success': 'secondary'} className='me-2' role={eV.id !== enrichmentVersion.id ? 'button': ''} onClick={() => fetchVersionById(eV.id)}>
                                    V{index + 1} {eV.initialVersion? '(Version généré par Aristote)': ''}
                                </Badge>
                            )
                            }
                        </div>
                        <div>
                            <strong>Titre : </strong>{enrichmentVersion.enrichmentVersionMetadata.title}
                        </div>
                        <div>
                            <strong>Description : </strong>{enrichmentVersion.enrichmentVersionMetadata.description}
                        </div>
                        <div>
                            <strong>Discipline : </strong>{enrichmentVersion.enrichmentVersionMetadata.discipline}
                        </div>
                        <div>
                            <strong>Type de média : </strong>{enrichmentVersion.enrichmentVersionMetadata.mediaType}
                        </div>
                        <div className='my-2'>
                            <Button onClick={downloadTranscript}>Télécharger la transciption</Button>
                        </div>
                        <div className='my-2'>
                            <Button onClick={downloadMultipleChoiceQuestions}>Télécharger le QCM</Button>
                        </div>
                        <div className='my-2 align-self-end'>
                            <Button onClick={createNewVersion} disabled={!modified}>Créer une nouvelle version</Button>
                        </div>
                    </div>

                    <div className='table-responsive mt-5'>
                        <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                            <thead>
                                <tr className="border-bottom text-center">
                                    <th style={{width: '400px'}} className="border-end">
                                        Question
                                    </th>
                                    <th style={{width: '300px'}} className="border-end">
                                        Explication
                                    </th>
                                    <th className="border-end">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichmentVersion.multipleChoiceQuestions ? enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map((multipleChoiceQuestion, index) => 
                                        <tr className="border-bottom" key={`question-row-${multipleChoiceQuestion.id}`}>
                                            <td className="border-end text-center">
                                                {multipleChoiceQuestion.question}
                                            </td>
                                            <td className="border-end text-center">
                                                {multipleChoiceQuestion.explanation}
                                            </td>
                                            <td className="border-end text-center">
                                                {enrichmentVersion.initialVersion?
                                                    <Button onClick={() => toggleModal(index)}>
                                                        Evaluation
                                                    </Button>
                                                    : null
                                                }
                                                <Button className='ms-3' onClick={() => toggleEditModal(index)}>
                                                    Modifier
                                                </Button>
                                            </td>
                                        </tr>

                                    ): null
                                }
                            </tbody>
                        </table>

                        <Modal show={showEditModal} onHide={toggleEditModal} size='xl'>
                            <Modal.Header closeButton onClick={() => console.log(enrichmentVersion)}>
                            <Modal.Title>Modifier</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Form>
                                    <Form.Group className="mb-3" controlId="question">
                                        <Form.Label>
                                            Question :
                                        </Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={3} 
                                            defaultValue={enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].question}
                                            onChange={updateQuestion}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="explanation">
                                        <Form.Label>
                                            Explication :
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            defaultValue={enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].explanation}
                                            onChange={updateExplanation}
                                        />
                                    </Form.Group>

                                    <div className='mb-3'>
                                        Réponses :
                                    </div>
                                    {enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices.sort(sortChoices).map((choice, index) => 
                                        <Form.Group
                                            key={`choice-
                                                ${choice.id}
                                                ${index}-of-
                                                ${enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices.length}`
                                            }
                                            className="mb-3 d-flex align-items-center" controlId={`choice-${index}`}
                                        >
                                            <Form.Check
                                                inline
                                                name="correctAnswer"
                                                type='radio'
                                                checked={choice.correctAnswer}
                                                onChange={() => updateChoiceCorrectAnswer(index)}
                                            />
                                            <Form.Control type="string" defaultValue={choice.optionText} onChange={value => updateChoiceText(index, value)}/>
                                            {enrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices.length > 1 ?
                                                <div onClick={() => removeOption(index)}>
                                                    <i className="ms-3 fa-solid fa-circle-xmark text-danger" role='button'></i>
                                                </div>
                                                :
                                                <div>
                                                    <i className="ms-3 fa-solid fa-circle-xmark text-muted"></i>
                                                </div>
                                            }
                                            
                                        </Form.Group>
                                    )}
                                    <div className='mt-3'>
                                        <Button onClick={addOption}>Add option</Button>
                                    </div>
                                </Form>
                            </Modal.Body>
                            <Modal.Footer className='d-flex'>
                                <div className='justify-content-end'>
                                    <Button onClick={() => toggleEditModal()}>Fermer</Button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                        <Modal show={show} onHide={toggleModal} size='xl'>
                            <Modal.Header closeButton>
                            <Modal.Title>QCMs</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Carousel
                                    activeIndex={currentMultipleChoiceQuestionIndex} 
                                    onSelect={(selectedIndex) => setCurrentMultipleChoiceQuestionIndex(selectedIndex)}
                                    variant='dark'
                                    interval={null}
                                    indicators={false}
                                >

                                    {enrichmentVersion.multipleChoiceQuestions ? 
                                        enrichmentVersion.multipleChoiceQuestions.map(multipleChoiceQuestion =>
                                        <Carousel.Item
                                            key={`mcq-
                                                ${multipleChoiceQuestion.id}
                                                ${multipleChoiceQuestion.thumbUp === true ? '-thumb-up' : ''}
                                                ${multipleChoiceQuestion.thumbUp === false ? '-thumb-down': ''}
                                            `}
                                            style={{paddingLeft: '15%', paddingRight: '15%'}}>
                                            <div className='d-flex align-items-center pb-3'>
                                                <h3 className='mb-0 me-2'>
                                                    {multipleChoiceQuestion.question}
                                                </h3>
                                                {enrichmentVersion.initialVersion ?
                                                    <>
                                                        <div onClick={() => evaluateMultipleChoiceQuestion(true)}>
                                                            {multipleChoiceQuestion.thumbUp === true ?
                                                                <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                                                : 
                                                                <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                                            }
                                                        </div>
                                                        <div onClick={() => evaluateMultipleChoiceQuestion(false)}>
                                                            {multipleChoiceQuestion.thumbUp === false ? 
                                                                <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                                                : 
                                                                <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                                            }
                                                        </div>
                                                    </>
                                                    : null
                                                }
                                            </div>
                                            {multipleChoiceQuestion.choices ? 
                                                multipleChoiceQuestion.choices.sort(sortChoices)
                                                    .map(choice =>
                                                    <div
                                                        key={`choice-
                                                            ${choice.id}
                                                            ${choice.thumbUp === true ? '-thumb-up' : ''}
                                                            ${choice.thumbUp === false ? '-thumb-down': ''}`
                                                        }
                                                        className='d-flex align-items-center'
                                                    >
                                                        <Badge 
                                                            bg={choice.correctAnswer? 'success': 'light'}
                                                            className={`my-2 me-2 ${choice.correctAnswer? '' : 'text-dark'}`}
                                                        >
                                                            {choice.optionText}
                                                        </Badge>
                                                        {enrichmentVersion.initialVersion ?
                                                            <>
                                                                <div onClick={() => evaluateChoice(choice.id, true)}>
                                                                    {choice.thumbUp === true ?
                                                                        <i className="fa-solid fa-thumbs-up me-3 text-success fa-xl" role='button'></i>
                                                                        : 
                                                                        <i className="fa-regular fa-thumbs-up me-3 text-success fa-lg" role='button'></i>
                                                                    }
                                                                </div>
                                                                <div onClick={() => evaluateChoice(choice.id, false)}>
                                                                    {choice.thumbUp === false ?
                                                                        <i className="fa-solid fa-thumbs-down me-3 text-danger fa-xl" role='button'></i>
                                                                        : 
                                                                        <i className="fa-regular fa-thumbs-down me-3 text-danger fa-lg" role='button'></i>
                                                                    }
                                                                </div>
                                                            </>
                                                            : null
                                                        }
                                                    </div>
                                                )
                                                    : null
                                            }
                                            {multipleChoiceQuestion.evaluation?
                                                <div className='mt-3'>
                                                    <h4 className='mb-2'>
                                                        Evaluation automatique :
                                                    </h4>
                                                    <div>
                                                        {multipleChoiceQuestion.evaluation? Object.keys(multipleChoiceQuestion.evaluation).map((criteria, index) => 
                                                            <div key={`criteria-${index}`} className='d-flex'>
                                                                <Badge bg={multipleChoiceQuestion.evaluation[criteria] ? 'success' : 'danger'} className='my-2'>
                                                                    {criteria}
                                                                </Badge>
                                                            </div>
                                                        )
                                                        : null
                                                        }
                                                    </div>
                                                </div>
                                                : null
                                            }
                                        </Carousel.Item>
                                        )
                                            : null
                                    }
                                </Carousel>
                            </Modal.Body>
                            <Modal.Footer>
                            <Button variant="secondary" onClick={() => toggleModal()}>
                                Fermer
                            </Button>
                            </Modal.Footer>
                        </Modal>
                        <Modal id='user-feedback-modal' show={showUserFeedbackModal} onHide={toggleUserFeedbackModal} size='lg'>
                            <Modal.Header closeButton>
                            <Modal.Title>Merci pour votre feedback</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Form onSubmit={sendMultipleChoiceQuestionFeedback}>
                                    <Form.Group className="mb-3" controlId="userFeedback">
                                        <Form.Label>
                                            Vous pouvez ajouter un commentaire si vous voulez :
                                        </Form.Label>
                                        <Form.Control as="textarea" rows={3} />
                                    </Form.Group>
                                    <div className='d-flex justify-content-end'>
                                        <Button id='send-feedback-button' type='submit' disabled={disableUserFeedbackForm}>
                                            {disableUserFeedbackForm ?
                                                <Spinner animation="border" size="sm" />
                                                :
                                                <span>
                                                    Envoyer le feedback
                                                </span>
                                            }
                                        </Button>
                                    </div>
                                </Form>
                            </Modal.Body>
                        </Modal>
                    </div>
                </div>
                : null
            }
            
        </div>
    )
}
