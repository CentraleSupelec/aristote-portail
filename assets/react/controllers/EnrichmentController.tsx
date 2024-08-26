import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Alert, Badge, Button, Form, Modal, Nav, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import EnrichmentVersions from '../interfaces/EnrichmentVersions';
import moment from 'moment';
import { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay';
import AiModelInfrastructureCombination from '../interfaces/AiModelInfrastructureCombination';
import SelectOption from '../interfaces/SelectOption';
import makeAnimated from "react-select/animated";
import Enrichment from '../interfaces/Enrichment';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { AVAILABLE_AIS, AVAILABLE_LANGUAGES, MEDIA_TYPES, NOTIFICATION_URL } from '../constants';
import AutoResizeTextarea from '../components/AutoResizeTextarea';

interface EnrichmentControllerProps {
    enrichmentId: string,
    enrichmentVersion: EnrichmentVersion
}

export default function ({enrichmentId, enrichmentVersion: inputEnrichmentVersion} : EnrichmentControllerProps) {
    moment.locale('fr');
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichmentVersions, setEnrichmentVersions] = useState<EnrichmentVersion[]>([]);

    const animatedComponents = makeAnimated();
    const [selectedMediaTypes, setSelectedMediaTypes] = useState<SelectOption[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<SelectOption[]>([]);
    const [selectedAiModelInfrastructureCombination, setSelectedAiModelInfrastructureCombination] = useState<AiModelInfrastructureCombination>();
    const [selectedEvaluationAi, setSelectedEvaluationAi] = useState<SelectOption>();
    const [showTranslation, setShowTranslation] = useState<boolean>(false);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    const [aiModelInfrastructureCombinations, setAiModelInfrastructureCombinations] = useState<AiModelInfrastructureCombination[]>([]);
    const [loadingVersions, setLoadingVersions] = useState<boolean>(true);
    const [loadingEnrichment, setLoadingEnrichment] = useState<boolean>(true);

    const toggleRegenerateModal = () => {
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

    const toggleEditModal = () => {
        redirectToCreateNewVersionPage();
    }

    useEffect(() => {
        if (inputEnrichmentVersion) {
            setEnrichmentVersion(inputEnrichmentVersion);
        }
        fetchEnrichmentVersions();
    }, [inputEnrichmentVersion]);

    useEffect(() => {
        if (enrichmentId) {
            fetchEnrichment();
            fetchAiModelInfrastructureCombinations();
        }
    }, [enrichmentId]);

    const fetchEnrichment = () => {
        setLoadingEnrichment(true);
        fetch(Routing.generate('app_get_enrichment', { enrichmentId }))
            .then(response => response.json())
            .then((data: Enrichment) => {
                setSelectedDisciplines(data.disciplines.map(discipline => ({label: discipline, value: discipline})))
                setSelectedMediaTypes(data.mediaTypes.map(discipline => ({label: discipline, value: discipline})))
                setSelectedEvaluationAi({value: data.aiEvaluation, label: data.aiEvaluation})
                setLoadingEnrichment(false);
            })
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

        fetch(Routing.generate('app_create_new_ai_enrichment', {enrichmentId}), {
            method: 'POST',
            body: JSON.stringify({
                notificationWebhookUrl: NOTIFICATION_URL + Routing.generate('app_enrichment_notification'),
                enrichmentParameters
            })
        })
        .then(response => {
                if (response.status === 200) {
                    fetchEnrichmentVersions();
                    setDisableForm(false);
                    toggleRegenerateModal();
                    window.location.href = Routing.generate('app_home');
                } else {
                    setDisableForm(false);
                    setShowAlert(true);
                }
            }
        )
    }

    const fetchAiModelInfrastructureCombinations = () => {
        fetch(Routing.generate('app_get_ai_model_infrastructure_combinations'))
            .then(response => response.json())
            .then((data: AiModelInfrastructureCombination[]) => {
                setAiModelInfrastructureCombinations(data);
            })
    }

    const fetchEnrichmentVersions = () => {
        setLoadingVersions(true);
        fetch(Routing.generate('app_get_enrichment_versions', {enrichmentId}))
            .then(response => response.json())
            .then((data: EnrichmentVersions) => {
                setEnrichmentVersions(data.content);
                setLoadingVersions(false);
            })
    }

    const fetchVersionById = (versionId: string) => {
        fetch(Routing.generate('app_get_enrichment_version', {enrichmentId, versionId}))
            .then(response => response.json())
            .then((data: EnrichmentVersion) => {
                setEnrichmentVersion(data);
            })
    }

    const createBlob = (content: string, type: string) => {
        return new Blob([content], { type });
    }

    const downloadTranscript = () => {
        downloadObject(createBlob(JSON.stringify(enrichmentVersion.transcript, null, 2), 'application/json'), 'trasncript_' + enrichmentVersion.id + '.json');
    };

    const downloadTranscriptSrt = (format: string) => {
        let queryString = `?format=${format}`
        if (showTranslation) {
            queryString += `&language=${enrichmentVersion.translateTo}`;
        }

        fetch(Routing.generate('app_download_transcript', {enrichmentId, versionId: enrichmentVersion.id}) + queryString)
            .then(async response => {
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'subtitles.srt';

                if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }
                const blob = await response.blob();
                return { blob, filename };
            })
            .then(({blob, filename}) => {
                downloadObject(blob, filename)
            })
    };

    const downloadMultipleChoiceQuestions = () => {
        const moodleXML = convertToMoodleXML(enrichmentVersion.multipleChoiceQuestions);
        downloadObject(createBlob(moodleXML, 'application/text'), 'moodle_quizz' + enrichmentVersion.id + '.xml')
    };

    const downloadObject = (blob: Blob, fileName: string) => {        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        
        downloadLink.download = fileName;
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

    const redirectToEvaluationPage = () => {
        window.location.href = Routing.generate('app_enrichment_evaluate', {enrichmentId});
    }

    const redirectToCreateNewVersionPage = () => {
        window.location.href = Routing.generate('app_create_new_version', {enrichmentId});
    }

    const renderTooltip = (props: OverlayInjectedProps) => (
        <Tooltip id="status-tooltip" {...props}>
            Généré par Aristote
        </Tooltip>
    );

    return (
        <div>
            {
                enrichmentVersion?
                <div>
                    <div className='d-flex flex-column'>
                        <div className='d-flex'>
                            <strong className='pe-2'>Versions :</strong>
                            {!loadingVersions && enrichmentVersions.map((eV, index) => 
                                <OverlayTrigger
                                    key={`select-version-${eV.id}`}
                                    placement="top"
                                    delay={{ show: 100, hide: 100 }}
                                    overlay={eV.aiGenerated? renderTooltip: <></>}
                                >
                                    <Badge
                                        bg={eV.id === enrichmentVersion.id ? 'success': 'secondary'}
                                        className='me-2 d-flex align-items-center' role={eV.id !== enrichmentVersion.id ? 'button': ''}
                                        onClick={() => fetchVersionById(eV.id)}
                                    >
                                        <div>
                                            V{index + 1}
                                        </div>
                                        {eV.aiGenerated && <img className='ps-1' src='/build/images/ai-icon.png' height={20}/>}
                                    </Badge>
                                </OverlayTrigger>
                            )}
                            {!loadingVersions &&
                                <Badge
                                    bg='primary'
                                    className={`me-2 d-flex align-items-center btn btn-primary ${loadingEnrichment? 'disabled' : ''}`} role='button'
                                    onClick={() => toggleRegenerateModal()}
                                >
                                    <div>
                                        + IA
                                    </div>
                                </Badge>
                            }
                            {loadingVersions &&
                                <div>
                                    <Spinner size='sm'></Spinner>
                                </div>
                            }
                        </div>
                        {enrichmentVersion && enrichmentVersion.translateTo ?
                            <div className='d-flex mt-2 align-items-center'>
                                <strong className='pe-2'>Langue :</strong>
                                <Nav id='language-tabs-container' variant="tabs" defaultActiveKey="language">
                                    <Nav.Item>
                                        <Nav.Link eventKey="language" onClick={() => setShowTranslation(false)}>
                                            {AVAILABLE_LANGUAGES.filter(language => language.value === enrichmentVersion.language)[0]?.label}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="translateTo" onClick={() => setShowTranslation(true)}>
                                            {AVAILABLE_LANGUAGES.filter(language => language.value === enrichmentVersion.translateTo)[0]?.label}
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                            : null
                        }
                        {enrichmentVersion.enrichmentVersionMetadata &&
                            <>
                                <div>
                                    <strong>Titre : </strong>{showTranslation? enrichmentVersion.enrichmentVersionMetadata.translatedTitle: enrichmentVersion.enrichmentVersionMetadata.title}
                                </div>
                                <div>
                                    <strong>Description : </strong>{showTranslation? enrichmentVersion.enrichmentVersionMetadata.translatedDescription: enrichmentVersion.enrichmentVersionMetadata.description}
                                </div>
                                <div>
                                    <strong>Discipline : </strong>{enrichmentVersion.enrichmentVersionMetadata.discipline}
                                </div>
                                <div>
                                    <strong>Nature du média : </strong>{enrichmentVersion.enrichmentVersionMetadata.mediaType}
                                </div>
                            </>
                        }
                        {enrichmentVersion.notes &&
                            <div>
                                <div>
                                    <strong>Prise de notes : </strong>
                                </div>
                                <AutoResizeTextarea
                                    disabled={true}
                                    value={showTranslation? enrichmentVersion.translatedNotes: enrichmentVersion.notes}
                                />
                            </div>
                        }
                        <div className='my-2'>
                            <Button variant='secondary' className='me-3 my-1' onClick={downloadTranscript}>Télécharger la transcription (JSON)</Button>
                            <Button variant='secondary' className='me-3 my-1' onClick={() => downloadTranscriptSrt("srt")}>Télécharger la transcription (SRT)</Button>
                            <Button variant='secondary' className='me-3 my-1' onClick={() => downloadTranscriptSrt("vtt")}>Télécharger la transcription (VTT)</Button>

                            {enrichmentVersion.multipleChoiceQuestions && enrichmentVersion.multipleChoiceQuestions.length > 0 &&
                                <Button variant='secondary' className='me-3 my-1' onClick={downloadMultipleChoiceQuestions}>Télécharger le QCM</Button>
                            }
                        </div>

                        {enrichmentVersion.aiGenerated? 
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
                    {enrichmentVersion.multipleChoiceQuestions && enrichmentVersion.multipleChoiceQuestions.length > 0 &&
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
                                    {enrichmentVersion.multipleChoiceQuestions.sort(sortMCQs).map(multipleChoiceQuestion => 
                                            <tr className="border-bottom" key={`question-row-${multipleChoiceQuestion.id}`}>
                                                <td className="border-end text-center">
                                                    {showTranslation? multipleChoiceQuestion.translatedQuestion: multipleChoiceQuestion.question}
                                                </td>
                                                <td className="border-end text-center">
                                                    {showTranslation? multipleChoiceQuestion.translatedExplanation: multipleChoiceQuestion.explanation}
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
                                                                {showTranslation? choice.translatedOptionText: choice.optionText}
                                                            </Badge>
                                                        </div>
                                                        )
                                                    : null}
                                                </td>
                                            </tr>

                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
                : null
            }
            
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
                        {enrichmentVersion && enrichmentVersion.enrichmentVersionMetadata &&
                            <>
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
                            </>
                        }
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
        </div>
    )
}
