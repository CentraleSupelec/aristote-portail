import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import Routing from '../../Routing';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import makeAnimated from "react-select/animated";
import Enrichments from '../interfaces/Enrichments';
import EnrichmentsList from '../components/EnrichmentsList';
import SelectOption from '../interfaces/SelectOption';

export default function () {
    const NOTIFICATION_URL = window.location.origin.replace('localhost', 'host.docker.internal');
    const [enrichments, setEnrichments] = useState<Enrichments>();
    const [selectedMediaTypes, setSelectedMediaTypes] = useState<SelectOption[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<SelectOption[]>([]);
    const [selectedAi, setSelectedAi] = useState<SelectOption>();
    const [showModal, setShowModal] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    const [uploadViaUrl, setUploadViaUrl] = useState<boolean>(true);

    const toggleModal = () => setShowModal(!showModal);
    const animatedComponents = makeAnimated();
    const mediaTypes = [
        {value: 'Conférence', label: 'Conférence'},
        {value: 'Cours', label: 'Cours'},
        {value: 'Amphi', label: 'Amphi'}
    ]

    const availableAIs = [
        {value: null, label: "Pas d'évaluation"},
        {value: 'ChatGPT', label: 'ChatGPT'},
    ]

    useEffect(() => {
        fetchEnrichments();
    }, []);

    const fetchEnrichments = () => {
        fetch(Routing.generate('app_enrichments'))
            .then(response => response.json())
            .then(data => {
                console.log(data);
                setEnrichments(data);
            })
    }

    const uploadVideoByUrl = (event: BaseSyntheticEvent) => {
        event.preventDefault();
        setDisableForm(true);
        console.log(event);
        const enrichmentParameters = {
            mediaTypes: selectedMediaTypes.map(mediaType => mediaType.value),
            disciplines: selectedDisciplines.map(discipline => discipline.value),
        }
        if (selectedAi?.value) {
            enrichmentParameters['aiEvaluation'] = selectedAi.value;
        }

        if (uploadViaUrl) {
            const url = event.target[2].value;

            fetch(Routing.generate('app_create_enrichment_by_url'), {
                method: 'POST',
                body: JSON.stringify({
                    url,
                    notificationWebhookUrl: NOTIFICATION_URL + Routing.generate('app_enrichment_notification'),
                    enrichmentParameters
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                fetchEnrichments();
                setDisableForm(false);
                toggleModal();
            })
        } else {
            const file = event.target[2].files[0];
            const params = new FormData();
            params.append('file', file);
            params.append('notificationWebhookUrl', NOTIFICATION_URL + Routing.generate('app_enrichment_notification'));
            params.append('enrichmentParameters', JSON.stringify(enrichmentParameters))

            fetch(Routing.generate("app_create_enrichment_by_file"), {
                    method: 'POST',
                    body: params
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    fetchEnrichments();
                    setDisableForm(false);
                    toggleModal();
                })
        }
    }

    const onMediaTypesChange = (newValue: SelectOption[]) => {
        setSelectedMediaTypes(newValue);
    }

    const onDisciplinesChange = (newValue: SelectOption[]) => {
        setSelectedDisciplines(newValue);
    }

    const onAiChange = (newValue: SelectOption) => {
        setSelectedAi(newValue);
    }

    return (
        <div className='d-flex flex-column align-items-center'>
            <div>
                <Button id='open-enrichment-creation-modal-button' onClick={() => toggleModal()}>
                    Créer un enrichissement
                </Button>
                <Modal show={showModal} onHide={toggleModal} size='lg'>
                    <Modal.Header closeButton>
                        <Modal.Title>Créer un enrichissement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={uploadVideoByUrl}>
                            <div className='mb-4'>
                                <Form.Check
                                    inline
                                    label="Téléverser via URL"
                                    name="uploadType"
                                    type='radio'
                                    checked={uploadViaUrl}
                                    onChange={() => setUploadViaUrl(true)}
                                />
                                <Form.Check
                                    inline
                                    label="Téléverser depuis votre ordinateur"
                                    name="uploadType"
                                    type='radio'
                                    checked={!uploadViaUrl}
                                    onChange={() => setUploadViaUrl(false)}
                                />
                            </div>
                            {uploadViaUrl? 
                                <Form.Group className="mb-3" controlId="mediaUpload.url">
                                    <Form.Label>URL du fichier média</Form.Label>
                                    <Form.Control placeholder="Entrez l'URL de votre fichier" type="string" />
                                </Form.Group>
                                :
                                <Form.Group className="mb-3" controlId="mediaUpload.file">
                                    <Form.Label>Téléverser le fichier média</Form.Label>
                                    <Form.Control type="file" />
                                </Form.Group>
                            }
                            <Form.Group className="mb-3" controlId="mediaUpload.aiEvaluation">
                                <Form.Label>IA d'évaluation</Form.Label>
                                <Select
                                    className='mb-3'
                                    components={animatedComponents}
                                    options={availableAIs}
                                    placeholder="Choisissez l'IA qui évaluera la proposition d'Aristote"
                                    onChange={onAiChange}
                                />
                            </Form.Group>
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
                                    options={mediaTypes}
                                    placeholder='Conférence, cours, webinaire, ...'
                                    onChange={onMediaTypesChange}
                                />
                            </Form.Group>
                            <div className='d-flex justify-content-end'>
                                <Button id='create-enrichment-button' type='submit' disabled={disableForm}>
                                    {disableForm ?
                                        <Spinner animation="border" size="sm" />
                                        :
                                        <span>
                                            Créer un enrichissement
                                        </span>
                                    }
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
            <div className='mt-5 w-100'>
                <EnrichmentsList enrichments={enrichments}></EnrichmentsList>
            </div>
        </div>
    )
}
