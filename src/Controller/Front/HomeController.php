<?php

namespace App\Controller\Front;

use App\Service\AristoteApiService;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class HomeController extends AbstractController
{
    public function __construct(
        private readonly string $fromEmail,
        private readonly AristoteApiService $aristoteApiService
    ) {
    }

    #[Route('/', name: 'app_home', options: ['expose' => true])]
    public function home(): Response
    {
        return $this->render('home/index.html.twig', [
            'controller_name' => 'HomeController',
        ]);
    }

    #[Route('/api/webhook', name: 'app_enrichment_notification', options: ['expose' => true], methods: ['POST'])]
    public function sendEmailNotification(Request $request, HttpClientInterface $httpClient, MailerInterface $mailer,
    ): JsonResponse {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $enrichmentId = $requestBody['id'];
        $status = $requestBody['status'];

        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s', $enrichmentId));
        $enrichment = $response->toArray();

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
    public function createEnrichmentByUrl(Request $request, HttpClientInterface $httpClient): JsonResponse
    {
        $user = $this->getUser();
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $requestBody['endUserIdentifier'] = $user->getUserIdentifier();
        $response = $this->aristoteApiService->apiRequestWithToken('POST', '/enrichments/url', [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);

        return new JsonResponse($response->toArray());
    }

    #[Route('/api/enrichments/upload', name: 'app_create_enrichment_by_file', options: ['expose' => true], methods: ['POST'])]
    public function createEnrichmentByFile(Request $request, HttpClientInterface $httpClient): JsonResponse
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

        return new JsonResponse($response->toArray());
    }

    #[Route('/api/enrichments/{enrichmentId}/new_ai_enrichment', name: 'app_create_new_ai_enrichment', options: ['expose' => true], methods: ['POST'])]
    public function createNewAiEnrichment(string $enrichmentId, Request $request, HttpClientInterface $httpClient): JsonResponse
    {
        $user = $this->getUser();
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $requestBody['endUserIdentifier'] = $user->getUserIdentifier();
        $response = $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/new_ai_version', $enrichmentId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);

        return new JsonResponse($response->toArray());
    }

    #[Route('/enrichments/{enrichmentId}', name: 'app_enrichment', options: ['expose' => true])]
    public function enrichmentById(string $enrichmentId): Response
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/latest', $enrichmentId));
        $data = $response->toArray();
        if (true === $data['aiGenerated'] && null === $data['lastEvaluationDate']) {
            return $this->redirectToRoute('app_enrichment_evaluate', ['enrichmentId' => $enrichmentId]);
        }

        return $this->render('home/enrichment.html.twig', ['enrichmentId' => $enrichmentId, 'enrichmentVersion' => $data]);
    }

    #[Route('/enrichments/{enrichmentId}/create_new_version', name: 'app_create_new_version', options: ['expose' => true])]
    public function createNewVersion(string $enrichmentId): Response
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/latest', $enrichmentId));
        $data = $response->toArray();

        return $this->render('home/new_enrichment_version.html.twig', ['enrichmentId' => $enrichmentId, 'enrichmentVersion' => $data]);
    }

    #[Route('/enrichments/{enrichmentId}/evaluate', name: 'app_enrichment_evaluate', options: ['expose' => true])]
    public function evaluateEnrichment(string $enrichmentId): Response
    {
        return $this->render('home/enrichment_evaluate.html.twig', ['enrichmentId' => $enrichmentId]);
    }

    #[Route('/api/enrichments', name: 'app_enrichments', options: ['expose' => true])]
    public function enrichments(HttpClientInterface $httpClient): JsonResponse
    {
        $user = $this->getUser();
        $response = $this->aristoteApiService->apiRequestWithToken('GET', '/enrichments', [
            'query' => [
                'endUserIdentifier' => $user->getUserIdentifier(),
                'withStatus' => 'true',
            ],
        ]);
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/latest', name: 'app_latest_enrichment_version', options: ['expose' => true])]
    public function latestEnrichmentVersion(string $enrichmentId): JsonResponse
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/latest', $enrichmentId));
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions', name: 'app_get_enrichment_versions', methods: ['GET'], options: ['expose' => true])]
    public function getEnrichmentVersions(string $enrichmentId): JsonResponse
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions?withTranscript=false&order=ASC&size=50', $enrichmentId));
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}', name: 'app_get_enrichment_version', options: ['expose' => true])]
    public function getEnrichmentVersion(string $enrichmentId, string $versionId): JsonResponse
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s/versions/%s', $enrichmentId, $versionId));
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichment/{enrichmentId}', name: 'app_get_enrichment', options: ['expose' => true])]
    public function getEnrichment(string $enrichmentId): JsonResponse
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', sprintf('/enrichments/%s', $enrichmentId));
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichments/{enrichmentId}', name: 'app_delete_enrichment', options: ['expose' => true], methods: ['DELETE'])]
    public function deleteEnrichmentById(string $enrichmentId): Response
    {
        $response = $this->aristoteApiService->apiRequestWithToken('DELETE', sprintf('/enrichments/%s', $enrichmentId));
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichments/get_ai_model_infrastructure_combinations', name: 'app_get_ai_model_infrastructure_combinations', options: ['expose' => true])]
    public function getAiModelInfrastructureCombinations(): Response
    {
        $response = $this->aristoteApiService->apiRequestWithToken('GET', '/enrichments/ai_model_infrastructure_combinations');
        $data = $response->toArray();

        return new JsonResponse($data);
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/evaluate', name: 'app_evaluate_enrichment_version', methods: ['POST'], options: ['expose' => true])]
    public function evaluatEnrichmentVersion(string $enrichmentId, string $versionId, Request $request): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $response = $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions/%s/evaluate', $enrichmentId, $versionId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);

        return new JsonResponse($response->toArray());
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/mcq/{mcqId}', name: 'app_evaluate_mcq', methods: ['POST'], options: ['expose' => true])]
    public function evaluateMcq(string $enrichmentId, string $versionId, string $mcqId, Request $request): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $response = $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions/%s/mcq/%s', $enrichmentId, $versionId, $mcqId), [
            'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
        ]);

        return new JsonResponse($response->toArray());
    }

    #[Route('/api/enrichment/{enrichmentId}/versions/{versionId}/mcq/{mcqId}/choice/{choiceId}', name: 'app_evaluate_choice', methods: ['POST'], options: ['expose' => true])]
    public function evaluateChoice(string $enrichmentId, string $versionId, string $mcqId, string $choiceId, Request $request): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $response = $this->aristoteApiService->apiRequestWithToken('POST',
            sprintf('/enrichments/%s/versions/%s/mcq/%s/choice/%s', $enrichmentId, $versionId, $mcqId, $choiceId),
            [
                'body' => json_encode($requestBody, JSON_THROW_ON_ERROR),
            ]
        );

        return new JsonResponse($response->toArray());
    }

    #[Route('/api/enrichment/{enrichmentId}/versions', name: 'app_create_enrichment_version', methods: ['POST'], options: ['expose' => true])]
    public function createEnrichmentVersion(string $enrichmentId, Request $request): JsonResponse
    {
        $multipleChoiceQuestions = $request->request->get('multipleChoiceQuestions');
        $enrichmentVersionMetadata = $request->request->get('enrichmentVersionMetadata');
        $translate = $request->request->get('translate');

        $response = $this->aristoteApiService->apiRequestWithToken('POST', sprintf('/enrichments/%s/versions', $enrichmentId), [
            'body' => [
                'enrichmentVersionMetadata' => $enrichmentVersionMetadata,
                'multipleChoiceQuestions' => $multipleChoiceQuestions,
                'translate' => 'true' === $translate,
            ],
            'headers' => [
                'Content-Type' => 'multipart/form-data',
            ],
        ]);

        return new JsonResponse($response->toArray());
    }
}
