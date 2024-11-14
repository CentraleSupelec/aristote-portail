<?php

namespace App\Controller\Front;

use App\Controller\Api\EnrichmentsApiController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController
{
    public function __construct(
        private readonly EnrichmentsApiController $enrichmentsApiController,
    ) {
    }

    #[Route('/', name: 'app_home', options: ['expose' => true])]
    public function home(): Response
    {
        $user = $this->getUser();

        return $this->render('home/index.html.twig', [
            'user' => $user->getUserIdentifier(),
        ]);
    }

    #[Route('/enrichments/{enrichmentId}', name: 'app_enrichment', options: ['expose' => true])]
    public function enrichmentById(string $enrichmentId): Response
    {
        $user = $this->getUser();
        $enrichmentResponse = $this->enrichmentsApiController->getEnrichment($enrichmentId);

        if (Response::HTTP_OK !== $enrichmentResponse->getStatusCode()) {
            return $enrichmentResponse;
        }
        $enrichment = json_decode($enrichmentResponse->getContent(), true, 512, JSON_THROW_ON_ERROR);

        if ('SUCCESS' !== $enrichment['status']) {
            $versionsResponse = $this->enrichmentsApiController->getEnrichmentVersions($enrichmentId, false);
            $versions = json_decode($versionsResponse->getContent(), true, 512, JSON_THROW_ON_ERROR);

            if ((is_countable($versions['content']) ? count($versions['content']) : 0) < 2) {
                return new Response(status: Response::HTTP_FORBIDDEN);
            }

            $latestSuccessfulVersionId = $versions['content'][(is_countable($versions['content']) ? count($versions['content']) : 0) - 2]['id'];
            $latestSuccessfulVersionResponse = $this->enrichmentsApiController->getEnrichmentVersion($enrichmentId, $latestSuccessfulVersionId, false);
        } else {
            $latestSuccessfulVersionResponse = $this->enrichmentsApiController->latestEnrichmentVersion($enrichmentId, false);
        }

        $latestSuccessfulVersion = json_decode($latestSuccessfulVersionResponse->getContent(), true, 512, JSON_THROW_ON_ERROR);

        if (
            true === $latestSuccessfulVersion['aiGenerated'] && null === $latestSuccessfulVersion['lastEvaluationDate']
            && (
                null !== $latestSuccessfulVersion['enrichmentVersionMetadata'] || [] !== $latestSuccessfulVersion['multipleChoiceQuestions']
            )
        ) {
            return $this->redirectToRoute('app_enrichment_evaluate', ['enrichmentId' => $enrichmentId]);
        }

        return $this->render('home/enrichment.html.twig', ['enrichmentId' => $enrichmentId, 'enrichmentVersion' => $latestSuccessfulVersion, 'user' => $user->getUserIdentifier()]);
    }

    #[Route('/enrichments/{enrichmentId}/create_new_version', name: 'app_create_new_version', options: ['expose' => true])]
    public function createNewVersion(string $enrichmentId): Response
    {
        $latestEnrichmentVersion = $this->enrichmentsApiController->latestEnrichmentVersion($enrichmentId);

        if (Response::HTTP_OK !== $latestEnrichmentVersion->getStatusCode()) {
            return $latestEnrichmentVersion;
        }

        $latestEnrichmentVersionJson = json_decode($latestEnrichmentVersion->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $this->render('home/new_enrichment_version.html.twig', ['enrichmentId' => $enrichmentId, 'enrichmentVersion' => $latestEnrichmentVersionJson]);
    }

    #[Route('/enrichments/{enrichmentId}/evaluate', name: 'app_enrichment_evaluate', options: ['expose' => true])]
    public function evaluateEnrichment(string $enrichmentId): Response
    {
        return $this->render('home/enrichment_evaluate.html.twig', ['enrichmentId' => $enrichmentId]);
    }

    #[Route(path: '/validate_url', name: 'validate_url', methods: ['POST'], options: ['expose' => true])]
    public function validate_url(Request $request): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $url = $requestBody['url'];
        $headers = get_headers($url, 1);

        if (array_key_exists('Content-Type', $headers)
            && (
                str_starts_with((string) $headers['Content-Type'], 'video/')
                || str_starts_with((string) $headers['Content-Type'], 'audio/')
            )
        ) {
            return new JsonResponse(['validUrl' => true]);
        }

        return new JsonResponse(['validUrl' => false]);
    }
}
