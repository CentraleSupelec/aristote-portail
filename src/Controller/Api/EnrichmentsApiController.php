<?php

namespace App\Controller\Api;

use App\Service\AristoteApiService;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Routing\Annotation\Route;

class EnrichmentsApiController extends AbstractController
{
    public function __construct(
        private readonly string $fromEmail,
        private readonly AristoteApiService $aristoteApiService,
    ) {
    }

    #[Route('/api/webhook', name: 'app_enrichment_notification', options: ['expose' => true], methods: ['POST'])]
    public function sendEmailNotification(Request $request, MailerInterface $mailer,
    ): JsonResponse {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $enrichmentId = $requestBody['id'];
        $status = $requestBody['status'];

        $enrichment = json_decode($this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s', $enrichmentId))->getContent(), true, 512, JSON_THROW_ON_ERROR);

        if (array_key_exists('endUserIdentifier', $enrichment)) {
            $endUserIdentifier = $enrichment['endUserIdentifier'];
        } else {
            return new JsonResponse(['status' => 'KO', 'error' => sprintf('No endUserIdentifier found for the enrichment %s', $enrichmentId)], Response::HTTP_BAD_REQUEST);
        }

        $originalFileName = $enrichment['media']['originalFileName'];

        $email = (new TemplatedEmail())
            ->from(new Address($this->fromEmail, 'Portal Aristote'))
            ->to($endUserIdentifier)
            ->subject(sprintf("L'enrichissement de %s %s", $originalFileName, 'SUCCESS' === $status ? 'est terminé avec succès' : 'a échoué'))
            ->htmlTemplate('home/enrichment_notification.html.twig')
        ;

        $context = $email->getContext();
        $context['enrichment'] = $enrichment;
        $context['status'] = $status;

        $email->context($context);
        $mailer->send($email);

        return new JsonResponse(['status' => 'OK']);
    }

    #[Route('/api/enrichments/url', name: 'app_create_enrichment_by_url', options: ['expose' => true], methods: ['POST'])]
    public function createEnrichmentByUrl(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $requestBody['endUserIdentifier'] = $user->getUserIdentifier();

        return $this->aristoteApiService->apiRequestWithToken('POST', '/enrichments/url', [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);
    }

    #[Route('/api/enrichments/upload', name: 'app_create_enrichment_by_file', options: ['expose' => true], methods: ['POST'])]
    public function createEnrichmentByFile(Request $request): JsonResponse
    {
        $user = $this->getUser();
        /** @var UploadedFile $file */
        $file = $request->files->get('file');
        $notificationWebhookUrl = $request->request->get('notificationWebhookUrl');
        $enrichmentParameters = $request->request->get('enrichmentParameters');
        $fileResource = fopen($file->getPathname(), 'r');

        $response = $this->aristoteApiService->apiRequestWithToken('POST', '/enrichments/upload', [
            'body' => [
                'file' => $fileResource,
                'originalFileName' => $file->getClientOriginalName(),
                'notificationWebhookUrl' => $notificationWebhookUrl,
                'endUserIdentifier' => $user->getUserIdentifier(),
                'enrichmentParameters' => $enrichmentParameters,
            ],
            'headers' => [
                'Content-Type' => 'multipart/form-data',
            ],
            'timeout' => 1800,
        ]);
        fclose($fileResource);

        return $response;
    }

    #[Route('/api/enrichments/{enrichmentId}/new_ai_enrichment', name: 'app_create_new_ai_enrichment', options: ['expose' => true], methods: ['POST'])]
    public function createNewAiEnrichment(string $enrichmentId, Request $request): JsonResponse
    {
        $user = $this->getUser();
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $requestBody['endUserIdentifier'] = $user->getUserIdentifier();

        return $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/new_ai_version', $enrichmentId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);
    }

    #[Route('/api/enrichments', name: 'app_enrichments', options: ['expose' => true])]
    public function enrichments(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $page = $request->query->get('page', 1);

        return $this->aristoteApiService->apiRequestWithToken('GET', '/enrichments', [
            'query' => [
                'endUserIdentifier' => $user->getUserIdentifier(),
                'withStatus' => 'true',
                'page' => $page,
                'size' => 10,
            ],
        ]);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/latest', name: 'app_latest_enrichment_version', options: ['expose' => true])]
    public function latestEnrichmentVersion(string $enrichmentId, bool $checkAuthorization = true): Response
    {
        if ($checkAuthorization) {
            $enrichmentResponse = $this->getEnrichment($enrichmentId);

            if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
                return $enrichmentResponse;
            }
        }

        return $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/latest', $enrichmentId));
    }

    #[Route('/api/enrichment/{enrichmentId}/versions', name: 'app_get_enrichment_versions', methods: ['GET'], options: ['expose' => true])]
    public function getEnrichmentVersions(string $enrichmentId, bool $checkAuthorization = true): Response
    {
        if ($checkAuthorization) {
            $enrichmentResponse = $this->getEnrichment($enrichmentId);

            if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
                return $enrichmentResponse;
            }
        }

        return $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions?withTranscript=false&order=ASC&size=50', $enrichmentId));
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}', name: 'app_get_enrichment_version', options: ['expose' => true])]
    public function getEnrichmentVersion(string $enrichmentId, string $versionId, bool $checkAuthorization = true): Response
    {
        if ($checkAuthorization) {
            $enrichmentResponse = $this->getEnrichment($enrichmentId);

            if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
                return $enrichmentResponse;
            }
        }

        return $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/%s', $enrichmentId, $versionId));
    }

    #[Route('/api/enrichment/{enrichmentId}', name: 'app_get_enrichment', options: ['expose' => true])]
    public function getEnrichment(string $enrichmentId): Response
    {
        $user = $this->getUser();
        $enrichmentResponse = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s', $enrichmentId));
        $enrichment = json_decode($enrichmentResponse->getContent(), true, 512, JSON_THROW_ON_ERROR);

        if ($enrichment['endUserIdentifier'] === $user->getUserIdentifier() || in_array($user->getUserIdentifier(), $enrichment['contributors'])) {
            return $enrichmentResponse;
        } else {
            return new Response(status: Response::HTTP_UNAUTHORIZED);
        }
    }

    #[Route('/api/enrichments/{enrichmentId}', name: 'app_delete_enrichment', options: ['expose' => true], methods: ['DELETE'])]
    public function deleteEnrichmentById(string $enrichmentId): Response
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        return $this->aristoteApiService->apiRequestWithToken('DELETE', sprintf('/enrichments/%s', $enrichmentId));
    }

    #[Route('/api/enrichments/get_ai_model_infrastructure_combinations', name: 'app_get_ai_model_infrastructure_combinations', options: ['expose' => true])]
    public function getAiModelInfrastructureCombinations(): Response
    {
        return $this->aristoteApiService->apiRequestWithToken('GET', '/enrichments/ai_model_infrastructure_combinations');
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/evaluate', name: 'app_evaluate_enrichment_version', methods: ['POST'], options: ['expose' => true])]
    public function evaluatEnrichmentVersion(string $enrichmentId, string $versionId, Request $request): Response
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions/%s/evaluate', $enrichmentId, $versionId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/mcq/{mcqId}', name: 'app_evaluate_mcq', methods: ['POST'], options: ['expose' => true])]
    public function evaluateMcq(string $enrichmentId, string $versionId, string $mcqId, Request $request): JsonResponse
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions/%s/mcq/%s', $enrichmentId, $versionId, $mcqId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/mcq/{mcqId}/choice/{choiceId}', name: 'app_evaluate_choice', methods: ['POST'], options: ['expose' => true])]
    public function evaluateChoice(string $enrichmentId, string $versionId, string $mcqId, string $choiceId, Request $request): JsonResponse
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $this->aristoteApiService->apiRequestWithToken('POST',
            sprintf('/enrichments/%s/versions/%s/mcq/%s/choice/%s', $enrichmentId, $versionId, $mcqId, $choiceId),
            [
                'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
            ]
        );
    }

    #[Route('/api/enrichment/{enrichmentId}/versions', name: 'app_create_enrichment_version', methods: ['POST'], options: ['expose' => true])]
    public function createEnrichmentVersion(string $enrichmentId, Request $request): JsonResponse
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        $multipleChoiceQuestions = $request->request->get('multipleChoiceQuestions');
        $enrichmentVersionMetadata = $request->request->get('enrichmentVersionMetadata');
        $notes = $request->request->get('notes');
        $translatedNotes = $request->request->get('translatedNotes');
        $translate = $request->request->get('translate');

        return $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions', $enrichmentId), [
            'body' => [
                'enrichmentVersionMetadata' => $enrichmentVersionMetadata,
                'multipleChoiceQuestions' => $multipleChoiceQuestions,
                'notes' => $notes,
                'translatedNotes' => $translatedNotes,
                'translate' => 'true' === $translate,
            ],
            'headers' => [
                'Content-Type' => 'multipart/form-data',
            ],
        ]);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/download_transcript', name: 'app_download_transcript', options: ['expose' => true])]
    public function downloadTranscript(string $enrichmentId, string $versionId, Request $request): BinaryFileResponse
    {
        $enrichmentResponse = $this->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }

        $format = $request->query->get('format', 'srt');
        $language = $request->query->get('language');

        $queryParams = [];

        if ($format) {
            $queryParams['format'] = $format;
        }

        if ($format) {
            $queryParams['language'] = $language;
        }

        return $this->aristoteApiService->apiRequestWithToken(
            'GET',
            sprintf('/enrichments/%s/versions/%s/download_transcript', $enrichmentId, $versionId),
            [
                'query' => $queryParams,
            ]
        );
    }
}
