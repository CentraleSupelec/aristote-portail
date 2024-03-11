import React, { useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Badge, Button } from 'react-bootstrap';
import EnrichmentVersion from '../interfaces/EnrichmentVersion';
import Choice from '../interfaces/Choice';
import MultipleChoiceQuestion from '../interfaces/MultipleChoiceQuestion';
import EnrichmentVersions from '../interfaces/EnrichmentVersions';
import moment from 'moment';

interface EnrichmentControllerProps {
    enrichmentId: string,
    enrichmentVersion: EnrichmentVersion
}

export default function ({enrichmentId, enrichmentVersion: inputEnrichmentVersion} : EnrichmentControllerProps) {
    moment.locale('fr');
    const [enrichmentVersion, setEnrichmentVersion] = useState<EnrichmentVersion>();
    const [enrichmentVersions, setEnrichmentVersions] = useState<EnrichmentVersion[]>([]);
    
    const toggleEditModal = () => {
        redirectToCreateNewVersionPage();
    }

    useEffect(() => {
        if (inputEnrichmentVersion) {
            setEnrichmentVersion(inputEnrichmentVersion);
        }
        fetchEnrichmentVersions();
    }, [inputEnrichmentVersion]);

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
                    </div>
                </div>
                : null
            }
            
        </div>
    )
}
