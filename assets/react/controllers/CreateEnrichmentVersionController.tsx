import React, { ChangeEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import Enrichment from '../interfaces/Enrichment';
import makeAnimated from "react-select/animated";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import SelectOption from '../interfaces/SelectOption';
import moment from 'moment';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

interface EnrichmentControllerProps {
    enrichmentId: string,
    enrichmentVersion: EnrichmentVersion
}

export default function ({ enrichmentId, enrichmentVersion: inputEnrichmentVersion }: EnrichmentControllerProps) {
    moment.locale('fr');
    const animatedComponents = makeAnimated();
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichment, setEnrichment] = useState<Enrichment>();
    const [modified, setModified] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);

    useEffect(() => {
        if (inputEnrichmentVersion) {
            setEnrichmentVersion(inputEnrichmentVersion);
        }
        fetchEnrichment();
    }, [inputEnrichmentVersion]);

    const fetchEnrichment = () => {
        fetch(Routing.generate('app_get_enrichment', { enrichmentId }))
            .then(response => response.json())
            .then(data => {
                setEnrichment(data);
            })
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
        if (firstMCQ.id === null) {
            return 1;
        } else if (secondMCQ.id === null) {
            return -1
        }
        return firstMCQ.id > secondMCQ.id ? 1 : -1;
    }

    const updateChoiceCorrectAnswer = (mcqIndex: number, choiceIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...enrichmentVersion.multipleChoiceQuestions[mcqIndex].choices
        ];
        temporaryChoices.forEach(choice => choice.correctAnswer = false);
        temporaryChoices[choiceIndex].correctAnswer = true;
        temporaryMCQs[mcqIndex].choices = temporaryChoices;
        setEnrichmentVersion({ ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs })
        setModified(true);
    }

    const addOption = (mcqIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let newChoice: Choice = {
            id: null,
            optionText: '',
            correctAnswer: false,
            thumbUp: null
        }
        temporaryMCQs[mcqIndex].choices.push(newChoice);
        let newEnrichmentVersion: EnrichmentVersion = { ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs };
        setEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const removeOption = (mcqIndex: number, choiceIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [...enrichmentVersion.multipleChoiceQuestions[mcqIndex].choices];
        temporaryChoices.splice(choiceIndex, 1);
        if (enrichmentVersion.multipleChoiceQuestions[mcqIndex].choices[choiceIndex].correctAnswer) {
            temporaryChoices[0].correctAnswer = true;
        }
        temporaryMCQs[mcqIndex].choices = temporaryChoices;
        let newEnrichmentVersion: EnrichmentVersion = { ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs };
        setEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const updateChoiceText = (mcqIndex: number, choiceIndex: number, value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...enrichmentVersion.multipleChoiceQuestions[mcqIndex].choices
        ];
        temporaryChoices[choiceIndex].optionText = value.target['value'];
        temporaryMCQs[mcqIndex].choices = temporaryChoices;
        setEnrichmentVersion({ ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs })
        setModified(true);
    }

    const updateQuestion = (mcqIndex: number, value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[mcqIndex].question = value.target['value'];
        setEnrichmentVersion({ ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs });
        setModified(true);
    }

    const updateExplanation = (mcqIndex: number, value: ChangeEvent) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[mcqIndex].explanation = value.target['value'];
        setEnrichmentVersion({ ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs })
        setModified(true);
    }

    const updateTitle = (value: ChangeEvent) => {
        let temporaryEnrichmentVersionMetadata = { ...enrichmentVersion.enrichmentVersionMetadata };
        temporaryEnrichmentVersionMetadata.title = value.target['value'];
        setEnrichmentVersion({ ...enrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata });
        setModified(true);
    }

    const updateDescription = (value: ChangeEvent) => {
        let temporaryEnrichmentVersionMetadata = { ...enrichmentVersion.enrichmentVersionMetadata };
        temporaryEnrichmentVersionMetadata.description = value.target['value'];
        setEnrichmentVersion({ ...enrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata });
        setModified(true);
    }

    const updateDiscipline = (option: SelectOption) => {
        let temporaryEnrichmentVersionMetadata = { ...enrichmentVersion.enrichmentVersionMetadata };
        temporaryEnrichmentVersionMetadata.discipline = option.value;
        setEnrichmentVersion({ ...enrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata });
        setModified(true);
    }

    const updateMediaType = (option: SelectOption) => {
        let temporaryEnrichmentVersionMetadata = { ...enrichmentVersion.enrichmentVersionMetadata };
        temporaryEnrichmentVersionMetadata.mediaType = option.value;
        setEnrichmentVersion({ ...enrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata });
        setModified(true);
    }

    const updateTopics = (options: SelectOption[]) => {
        let temporaryEnrichmentVersionMetadata = { ...enrichmentVersion.enrichmentVersionMetadata };
        temporaryEnrichmentVersionMetadata.topics = options.map(option => option.value);
        setEnrichmentVersion({ ...enrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata });
        setModified(true);
    }

    const updateAnswerPointer = (mcqIndex: number, value: string) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[mcqIndex].answerPointer.startAnswerPointer = value;
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const addMultipleChoiceQuestion = () => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        const multipleChoiceQuestionPlaceholder: MultipleChoiceQuestion = {
            id: null,
            question: null,
            explanation: null,
            thumbUp: null,
            userFeedback: null,
            evaluation: null,
            answerPointer: {
                startAnswerPointer: null,
                stopAnswerPointer: null
            },
            choices: [
                {
                    id: null,
                    optionText: null,
                    correctAnswer: true,
                    thumbUp: null
                }
            ]
        }
        temporaryMCQs.push(multipleChoiceQuestionPlaceholder);
        setEnrichmentVersion({...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const removeMultipleChoiceQuestion = (mcqIndex: number) => {
        let temporaryMCQs = [...enrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs.splice(mcqIndex, 1);
        let newEnrichmentVersion: EnrichmentVersion = { ...enrichmentVersion, multipleChoiceQuestions: temporaryMCQs };
        setEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const createNewVersion = () => {
        setDisableForm(true);
        const params = new FormData();
        params.append('multipleChoiceQuestions', JSON.stringify(enrichmentVersion.multipleChoiceQuestions));
        params.append('enrichmentVersionMetadata', JSON.stringify(enrichmentVersion.enrichmentVersionMetadata));
        fetch(Routing.generate('app_create_enrichment_version', { enrichmentId: enrichmentId, }), {
            method: 'POST',
            body: params
        })
            .then(response => response.json())
            .then(() => {
                redirectToEnrichmentPage();
            }
            )
    }

    const mapOptionCallback = (option: string) => {
        return {
            value: option,
            label: option
        }
    }

    const redirectToEnrichmentPage = () => {
        window.location.href = Routing.generate('app_enrichment', { enrichmentId });
    }

    return (
        <div>
            {
                enrichmentVersion && enrichment ?
                    <div style={{ paddingLeft: '15%', paddingRight: '15%' }}>
                        <Card className='mb-1'>
                            <Card.Body>
                                {enrichment ?
                                    <Form>
                                        <Form.Group className="mb-3" controlId="title">
                                            <Form.Label>
                                                Titre :
                                            </Form.Label>
                                            <Form.Control
                                                disabled={disableForm}
                                                as="textarea"
                                                rows={1}
                                                defaultValue={enrichmentVersion.enrichmentVersionMetadata.title}
                                                onChange={updateTitle}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="description">
                                            <Form.Label>
                                                Description :
                                            </Form.Label>
                                            <Form.Control
                                                disabled={disableForm}
                                                as="textarea"
                                                rows={1}
                                                defaultValue={enrichmentVersion.enrichmentVersionMetadata.description}
                                                onChange={updateDescription}
                                            />
                                        </Form.Group>
                                        <div className='d-flex'>
                                            <Form.Group className="mb-3 me-3 w-50" controlId="discipline">
                                                <Form.Label>Discipline :</Form.Label>
                                                <Select
                                                    components={animatedComponents}
                                                    defaultValue={mapOptionCallback(enrichmentVersion.enrichmentVersionMetadata.discipline)}
                                                    options={enrichment.disciplines.map(mapOptionCallback)}
                                                    onChange={updateDiscipline}
                                                />
                                            </Form.Group>
                                            <Form.Group className="mb-3 w-50" controlId="mediaType">
                                                <Form.Label>Type de média :</Form.Label>
                                                <Select
                                                    components={animatedComponents}
                                                    defaultValue={mapOptionCallback(enrichmentVersion.enrichmentVersionMetadata.mediaType)}
                                                    options={enrichment.mediaTypes.map(mapOptionCallback)}
                                                    onChange={updateMediaType}
                                                />
                                            </Form.Group>
                                        </div>
                                        <Form.Group className="mb-3" controlId="mediaType">
                                            <Form.Label>Topics :</Form.Label>
                                            <CreatableSelect
                                                className='mb-3'
                                                components={animatedComponents}
                                                isMulti
                                                defaultValue={enrichmentVersion.enrichmentVersionMetadata.topics.map(mapOptionCallback)}
                                                onChange={updateTopics}
                                            />
                                        </Form.Group>
                                    </Form>
                                    : null
                                }
                            </Card.Body>
                        </Card>
                        {enrichmentVersion.multipleChoiceQuestions ? enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map((multipleChoiceQuestion, mcqIndex) =>
                            <Form key={`mcq-${multipleChoiceQuestion.id}-${mcqIndex}-of-${enrichmentVersion.multipleChoiceQuestions.length}`} className='mt-4 d-flex flex-column'>
                                <Form.Group className="mb-3" controlId="question">
                                    <Form.Label>
                                        <div className='d-flex'>
                                            <strong>Question {mcqIndex+1}:</strong> 
                                            {enrichmentVersion.multipleChoiceQuestions.length > 1 ?
                                                <div onClick={() => removeMultipleChoiceQuestion(mcqIndex)}>
                                                    <i className="ms-3 fa-solid fa-trash-can text-danger" role='button'></i>
                                                </div>
                                                :
                                                <div>
                                                    <i className="ms-3 fa-solid fa-trash-can text-muted"></i>
                                                </div>
                                            }
                                        </div>
                                    </Form.Label>
                                    <Form.Control
                                        disabled={disableForm}
                                        as="textarea"
                                        rows={1}
                                        defaultValue={multipleChoiceQuestion.question}
                                        onChange={value => updateQuestion(mcqIndex, value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="explanation">
                                    <Form.Label>
                                        Explication :
                                    </Form.Label>
                                    <Form.Control
                                        disabled={disableForm}
                                        as="textarea"
                                        rows={1}
                                        defaultValue={multipleChoiceQuestion.explanation}
                                        onChange={value => updateExplanation(mcqIndex, value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="explanation">
                                    <Form.Label className='me-2'>
                                        Pointeur vers la réponse :
                                    </Form.Label>
                                    <TimePicker
                                        onChange={value => updateAnswerPointer(mcqIndex, value)}
                                        disableClock={true}
                                        format="HH:mm:ss"
                                        maxDetail="second"
                                        value={multipleChoiceQuestion.answerPointer?.startAnswerPointer}
                                        clockIcon={null}
                                    />
                                </Form.Group>
                                <div className='mb-3'>
                                    Réponses :
                                </div>
                                {multipleChoiceQuestion.choices.sort(sortChoices).map((choice, choiceIndex) =>
                                    <Form.Group key={`choice-${choice.id}-${choiceIndex}-of-${multipleChoiceQuestion.choices.length}`} className="mb-3 d-flex align-items-center" controlId={`choice-${choiceIndex}`}>
                                        <Form.Check
                                            disabled={disableForm}
                                            inline
                                            name="correctAnswer"
                                            type='radio'
                                            checked={choice.correctAnswer}
                                            onChange={() => updateChoiceCorrectAnswer(mcqIndex, choiceIndex)}
                                        />
                                        <Form.Control disabled={disableForm} type="string" defaultValue={choice.optionText} onChange={value => updateChoiceText(mcqIndex, choiceIndex, value)} />
                                        {multipleChoiceQuestion.choices.length > 1 ?
                                            <div onClick={() => removeOption(mcqIndex, choiceIndex)}>
                                                <i className="ms-3 fa-solid fa-trash-can text-danger" role='button'></i>
                                            </div>
                                            :
                                            <div>
                                                <i className="ms-3 fa-solid fa-trash-can text-muted"></i>
                                            </div>
                                        }

                                    </Form.Group>
                                )}
                                <div className='my-3 d-flex justify-content-end'>
                                    <Button disabled={disableForm} onClick={() => addOption(mcqIndex)}>Ajouter une réponse</Button>
                                </div>
                            </Form>
                        )
                            : null
                        }

                        <div className='my-3 d-flex justify-content-end'>
                            <Button disabled={disableForm} onClick={addMultipleChoiceQuestion}>Ajouter une question</Button>
                        </div>
                        <div className='mt-5 d-flex justify-content-end'>
                            <Button onClick={() => createNewVersion()} disabled={!modified} variant='success'>
                                {disableForm ?
                                    <Spinner animation="border" size="sm" />
                                    :
                                    <span>
                                        Créer une nouvelle version
                                    </span>
                                }
                            </Button>
                        </div>
                    </div>
                    : null
            }

        </div>
    )
}
