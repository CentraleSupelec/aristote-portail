import React, { BaseSyntheticEvent, ChangeEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Badge, Button, Carousel, Form, Modal, Spinner } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import EvaluationResponse from '../interfaces/EvaluationResponse';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import EnrichmentVersions from '../interfaces/EnrichmentVersions';
import cloneDeep from 'lodash/cloneDeep';
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

export default function ({enrichmentId, enrichmentVersion: inputEnrichmentVersion} : EnrichmentControllerProps) {
    moment.locale('fr');
    const animatedComponents = makeAnimated();
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [temporaryCopyEnrichmentVersion, setTemporaryCopyEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichmentVersions, setEnrichmentVersions] = useState<EnrichmentVersion[]>([]);
    const [enrichment, setEnrichment] = useState<Enrichment>();
    const [currentMultipleChoiceQuestionIndex, setCurrentMultipleChoiceQuestionIndex] = useState<number>(0);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [modified, setModified] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    
    const toggleEditModal = () => {
        redirectToCreateNewVersionPage();
    }

    const closeEditModal = () => {
        setTemporaryCopyEnrichmentVersion(enrichmentVersion);
        setShowEditModal(false);
    }

    useEffect(() => {
        if (inputEnrichmentVersion) {
            setEnrichmentVersion(inputEnrichmentVersion);
            setTemporaryCopyEnrichmentVersion(inputEnrichmentVersion);
        }
        fetchEnrichmentVersions();
        fetchEnrichment();
    }, [inputEnrichmentVersion]);

    const fetchEnrichment = () => {
        fetch(Routing.generate('app_get_enrichment', {enrichmentId}))
            .then(response => response.json())
            .then(data => {
                setEnrichment(data);
            })
    }

    const fetchLatestEnrichmentVersion = () => {
        fetch(Routing.generate('app_latest_enrichment_version', {enrichmentId}))
            .then(response => response.json())
            .then((data: EnrichmentVersion) => {
                setEnrichmentVersion(cloneDeep(data));
                setTemporaryCopyEnrichmentVersion(cloneDeep(data));
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
                setTemporaryCopyEnrichmentVersion(data);
            })
    }

    const downloadTranscript = () => {
        downloadJsonObject(enrichmentVersion.transcript, 'trasncript_' + enrichmentVersion.id);
    };

    const downloadMultipleChoiceQuestions = () => {
        const moodleXML = convertToMoodleXML(enrichmentVersion.multipleChoiceQuestions);
        downloadXML(moodleXML, 'moodle_quizz' + enrichmentVersion.id);
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

    const downloadXML = (xmlString: string, fileName: string) => {    
        const blob = new Blob([xmlString], { type: 'application/text' });
    
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        
        downloadLink.download = fileName + '.xml';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    function convertToMoodleXML(mcqs: MultipleChoiceQuestion[]) {
        let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlString += '<quiz>\n';
    
        mcqs.forEach((mcq) => {
            xmlString += '  <question type="multichoice">\n';
            xmlString += `    <name>\n`
            xmlString += `        <text>${escapeXml(mcq.question)}</text>\n`
            xmlString += `    </name>\n`;
            xmlString += `    <questiontext>\n`;
            xmlString += `        <text>${escapeXml(mcq.explanation)}</text>\n`;
            xmlString += `    </questiontext>\n`;
            xmlString += '    <defaultgrade>1.0000000</defaultgrade>\n';
            xmlString += '    <penalty>0.3333333</penalty>\n';
            xmlString += '    <single>true</single>\n';
            xmlString += '    <shuffleanswers>true</shuffleanswers>\n'
            xmlString += '    <answernumbering>abc</answernumbering>\n';
            xmlString += '    <showstandardinstruction>0</showstandardinstruction>\n';
            xmlString += '    <correctfeedback format="html">\n';
            xmlString += '        <text>Votre réponse est correcte.</text>\n';
            xmlString += '    </correctfeedback>\n';
            xmlString += '    <partiallycorrectfeedback format="html">\n';
            xmlString += '        <text>Votre réponse est partiellement correcte.</text>\n';
            xmlString += '    </partiallycorrectfeedback>\n';
            xmlString += '    <incorrectfeedback format="html">\n';
            xmlString += '        <text>Votre réponse est partiellement correcte.</text>\n';
            xmlString += '    </incorrectfeedback>\n';
            xmlString += '    <shownumcorrect/>\n';

            mcq.choices.forEach((choice) => {
                xmlString += `        <answer fraction="${choice.correctAnswer? '100': '0'}" format="html">\n`;
                xmlString += `            <text><![CDATA[<p dir="ltr" style="text-align: left;">${escapeXml(choice.optionText)}</p>]]></text>\n`;
                xmlString += '        </answer>\n';

            });
    
            xmlString += '  </question>\n';
        });
    
        xmlString += '</quiz>';
        return xmlString;
    }
    
    function escapeXml(unsafe: string) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
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
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...temporaryCopyEnrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices
        ];
        temporaryChoices.forEach(choice => choice.correctAnswer = false);
        temporaryChoices[choiceIndex].correctAnswer = true;
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const addOption = () => {
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        let newChoice: Choice = {
            id: null,
            optionText: '',
            correctAnswer: false,
            thumbUp: null
        }
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices.push(newChoice);
        let newEnrichmentVersion: EnrichmentVersion = {...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs};
        setTemporaryCopyEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const removeOption = (choiceIndex: number) => {
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices];
        temporaryChoices.splice(choiceIndex, 1);
        if (temporaryCopyEnrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices[choiceIndex].correctAnswer) {
            temporaryChoices[0].correctAnswer = true;
        }
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        let newEnrichmentVersion: EnrichmentVersion = {...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs};
        setTemporaryCopyEnrichmentVersion(newEnrichmentVersion);
        setModified(true);
    }

    const updateChoiceText = (choiceIndex: number, value: ChangeEvent) => {
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        let temporaryChoices = [
            ...temporaryCopyEnrichmentVersion.multipleChoiceQuestions[currentMultipleChoiceQuestionIndex].choices
        ];
        temporaryChoices[choiceIndex].optionText = value.target['value'];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].choices = temporaryChoices;
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const updateQuestion = (value: ChangeEvent) => {
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].question = value.target['value'];
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs});
        setModified(true);
    }

    const updateExplanation = (value: ChangeEvent) => {
        let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        temporaryMCQs[currentMultipleChoiceQuestionIndex].explanation = value.target['value'];
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        setModified(true);
    }

    const updateTitle = (value: ChangeEvent) => {
        let temporaryEnrichmentVersionMetadata = {...temporaryCopyEnrichmentVersion.enrichmentVersionMetadata};
        temporaryEnrichmentVersionMetadata.title = value.target['value'];
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata});
        setModified(true);
    }

    const updateDescription = (value: ChangeEvent) => {
        let temporaryEnrichmentVersionMetadata = {...temporaryCopyEnrichmentVersion.enrichmentVersionMetadata};
        temporaryEnrichmentVersionMetadata.description = value.target['value'];
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata});
        setModified(true);
    }

    const updateDiscipline = (option: SelectOption) => {
        let temporaryEnrichmentVersionMetadata = {...temporaryCopyEnrichmentVersion.enrichmentVersionMetadata};
        temporaryEnrichmentVersionMetadata.discipline = option.value;
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata});
        setModified(true);
    }

    const updateMediaType = (option: SelectOption) => {
        let temporaryEnrichmentVersionMetadata = {...temporaryCopyEnrichmentVersion.enrichmentVersionMetadata};
        temporaryEnrichmentVersionMetadata.mediaType = option.value;
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata});
        setModified(true);
    }

    const updateTopics = (options: SelectOption[]) => {
        let temporaryEnrichmentVersionMetadata = {...temporaryCopyEnrichmentVersion.enrichmentVersionMetadata};
        temporaryEnrichmentVersionMetadata.topics = options.map(option => option.value);
        setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, enrichmentVersionMetadata: temporaryEnrichmentVersionMetadata});
        setModified(true);
    }

    const updateAnswerPointer = (value: string) => {
        console.log(value);
        // let temporaryMCQs = [...temporaryCopyEnrichmentVersion.multipleChoiceQuestions];
        // temporaryMCQs[currentMultipleChoiceQuestionIndex].explanation = value.target['value'];
        // setTemporaryCopyEnrichmentVersion({...temporaryCopyEnrichmentVersion, multipleChoiceQuestions: temporaryMCQs})
        // setModified(true);
    }

    const createNewVersion = () => {
        setDisableForm(true);
        const params = new FormData();
        params.append('multipleChoiceQuestions', JSON.stringify(temporaryCopyEnrichmentVersion.multipleChoiceQuestions));
        params.append('enrichmentVersionMetadata', JSON.stringify(temporaryCopyEnrichmentVersion.enrichmentVersionMetadata));
        fetch(Routing.generate('app_create_enrichment_version', {enrichmentId: enrichmentId,}), {
                method: 'POST',
                body: params
            })
            .then(response => response.json())
            .then(() => {
                fetchLatestEnrichmentVersion();
                fetchEnrichmentVersions();
                setDisableForm(false);
                toggleEditModal();
            }
        )
    }

    const mapOptionCallback = (option: string) => {
        return {
            value: option,
            label: option
        }
    }

    const redirectToEvaluationPage = () => {
        window.location.href = Routing.generate('app_enrichment_evaluate', {enrichmentId});
    }

    const redirectToCreateNewVersionPage = () => {
        window.location.href = Routing.generate('app_create_new_version', {enrichmentId});
    }

    return (
        <div>
            {
                enrichmentVersion?
                <div>
                    <div className='d-flex flex-column'>
                        <div>
                            <strong>Versions : </strong>
                            {enrichmentVersions.map((eV, index) => 
                                <Badge
                                    key={`select-version-${eV.id}`}
                                    bg={eV.id === enrichmentVersion.id ? 'success': 'secondary'}
                                    className='me-2' role={eV.id !== enrichmentVersion.id ? 'button': ''}
                                    onClick={() => fetchVersionById(eV.id)}
                                >
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
                            <strong>Nature du média : </strong>{enrichmentVersion.enrichmentVersionMetadata.mediaType}
                        </div>
                        <div className='my-2'>
                            <Button variant='secondary' className='me-3' onClick={downloadTranscript}>Télécharger la transciption</Button>
                            <Button variant='secondary' onClick={downloadMultipleChoiceQuestions}>Télécharger le QCM</Button>
                        </div>

                        {enrichmentVersion.initialVersion? 
                            <div className='d-flex align-items-center'>
                                <strong>Date de la dernière évaluation :&nbsp;</strong>
                                <div className='me-2'>
                                    {enrichmentVersion.lastEvaluationDate ? moment(enrichmentVersion.lastEvaluationDate).format('Do MMMM YYYY à HH:mm') : "Pas d'évaluation effectuée"}
                                </div>
                                <div>
                                    <Button onClick={redirectToEvaluationPage}>Soumettre une {enrichmentVersion.lastEvaluationDate ? 'nouvelle': ''} évaluation</Button>
                                </div>
                            </div>
                            : null
                        }
                        <div className='my-2 align-self-end'>
                            <Button onClick={toggleEditModal}>Modifier</Button>
                        </div>
                    </div>

                    <div className='table-responsive table-striped mt-5'>
                        <table className="enrichment-table table table-sm table-borderless table-hover align-middle mb-0 border-bottom">
                            <thead>
                                <tr className="border-bottom text-center">
                                    <th className="border-end col-3">
                                        Question
                                    </th>
                                    <th className="border-end col-3">
                                        Explication
                                    </th>
                                    <th className="border-end col-6">
                                        Réponses
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichmentVersion.multipleChoiceQuestions ? enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map(multipleChoiceQuestion => 
                                        <tr className="border-bottom" key={`question-row-${multipleChoiceQuestion.id}`}>
                                            <td className="border-end text-center">
                                                {multipleChoiceQuestion.question}
                                            </td>
                                            <td className="border-end text-center">
                                                {multipleChoiceQuestion.explanation}
                                            </td>
                                            <td className="border-end text-center d-flex flex-column">
                                                {multipleChoiceQuestion.choices? multipleChoiceQuestion.choices.sort(sortChoices).map(choice => 
                                                    <div key={`choice-${choice.id}`} className='d-flex align-items-center'>
                                                        <i className={`me-2 ${choice.correctAnswer? 'fa-solid fa-check text-success' : 'fa-solid fa-xmark text-danger'}`}></i>
                                                        <Badge
                                                            key={`choice-${choice.id}`}
                                                            bg='light'
                                                            className='my-2 me-2 flex-grow-1 text-dark text-wrap'
                                                        >
                                                            {choice.optionText}
                                                        </Badge>
                                                    </div>
                                                    )
                                                : null}
                                            </td>
                                        </tr>

                                    ): null
                                }
                            </tbody>
                        </table>

                        <Modal show={showEditModal} onHide={toggleEditModal} size='xl'>
                            <Modal.Header closeButton>
                            <Modal.Title>Modifier</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div style={{paddingLeft: '15%', paddingRight: '15%'}}>
                                    {enrichment? 
                                        <Form>
                                            <Form.Group className="mb-3" controlId="title">
                                                <Form.Label>
                                                    Titre :
                                                </Form.Label>
                                                <Form.Control
                                                    disabled={disableForm}
                                                    as="textarea" 
                                                    rows={1} 
                                                    defaultValue={temporaryCopyEnrichmentVersion.enrichmentVersionMetadata.title}
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
                                                    defaultValue={temporaryCopyEnrichmentVersion.enrichmentVersionMetadata.description}
                                                    onChange={updateDescription}
                                                />
                                            </Form.Group>
                                            <div className='d-flex'>
                                                <Form.Group className="mb-3 me-3 w-50" controlId="discipline">
                                                    <Form.Label>Discipline :</Form.Label>
                                                    <Select
                                                        components={animatedComponents}
                                                        defaultValue={mapOptionCallback(temporaryCopyEnrichmentVersion.enrichmentVersionMetadata.discipline)}
                                                        options={enrichment.disciplines.map(mapOptionCallback)}
                                                        onChange={updateDiscipline}
                                                    />
                                                </Form.Group>
                                                <Form.Group className="mb-3 w-50" controlId="mediaType">
                                                    <Form.Label>Type de média :</Form.Label>
                                                    <Select
                                                        components={animatedComponents}
                                                        defaultValue={mapOptionCallback(temporaryCopyEnrichmentVersion.enrichmentVersionMetadata.mediaType)}
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
                                                    defaultValue={temporaryCopyEnrichmentVersion.enrichmentVersionMetadata.topics.map(mapOptionCallback)}
                                                    onChange={updateTopics}
                                                />
                                            </Form.Group>
                                        </Form>
                                        : null
                                    }
                                    <hr className='mt-3'/>
                                </div>
                                <Carousel
                                    activeIndex={currentMultipleChoiceQuestionIndex} 
                                    onSelect={(selectedIndex) => setCurrentMultipleChoiceQuestionIndex(selectedIndex)}
                                    variant='dark'
                                    interval={null}
                                    indicators={false}
                                >
                                    {temporaryCopyEnrichmentVersion.multipleChoiceQuestions ? temporaryCopyEnrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map(multipleChoiceQuestion =>
                                            <Carousel.Item key={`mcq-${multipleChoiceQuestion.id}`} style={{paddingLeft: '15%', paddingRight: '15%'}}>
                                                <Form>
                                                    <Form.Group className="mb-3" controlId="question">
                                                        <Form.Label>
                                                            Question :
                                                        </Form.Label>
                                                        <Form.Control
                                                            disabled={disableForm}
                                                            as="textarea" 
                                                            rows={1} 
                                                            defaultValue={multipleChoiceQuestion.question}
                                                            onChange={updateQuestion}
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
                                                            onChange={updateExplanation}
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3" controlId="explanation">
                                                        <Form.Label>
                                                            Pointeur vers la réponse :
                                                        </Form.Label>
                                                        <TimePicker 
                                                            onChange={updateAnswerPointer}
                                                            disableClock={true}
                                                            format="HH:mm:ss"
                                                            maxDetail="second"
                                                            value={multipleChoiceQuestion.answerPointer.startAnswerPointer}
                                                            clockIcon={null}
                                                        />
                                                    </Form.Group>
                                                    <div className='mb-3'>
                                                        Réponses :
                                                    </div>
                                                    {multipleChoiceQuestion.choices.sort(sortChoices).map((choice, index) => 
                                                        <Form.Group
                                                            key={`choice-
                                                                ${choice.id}
                                                                ${index}-of-
                                                                ${multipleChoiceQuestion.choices.length}`
                                                            } 
                                                            className="mb-3 d-flex align-items-center" controlId={`choice-${index}`}
                                                        >
                                                            <Form.Check
                                                                disabled={disableForm}
                                                                inline
                                                                name="correctAnswer"
                                                                type='radio'
                                                                checked={choice.correctAnswer}
                                                                onChange={() => updateChoiceCorrectAnswer(index)}
                                                            />
                                                            <Form.Control disabled={disableForm} type="string" defaultValue={choice.optionText} onChange={value => updateChoiceText(index, value)}/>
                                                            {multipleChoiceQuestion.choices.length > 1 ?
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
                                                        <Button disabled={disableForm} onClick={addOption}>Add option</Button>
                                                    </div>
                                                </Form>
                                            </Carousel.Item>
                                        )
                                        : null
                                    }
                                </Carousel>
                            </Modal.Body>
                            <Modal.Footer className='d-flex'>
                                <div className='justify-content-end'>
                                    <Button className='me-3' onClick={() => closeEditModal()} variant='secondary'>Annuler</Button>
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
                            </Modal.Footer>
                        </Modal>
                    </div>
                </div>
                : null
            }
            
        </div>
    )
}
