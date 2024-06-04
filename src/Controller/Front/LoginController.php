<?php

namespace App\Controller\Front;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Stevenmaguire\OAuth2\Client\Provider\Keycloak;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class LoginController extends AbstractController
{
    public function __construct(
        private readonly bool $keycloakEnabled,
        private readonly string $keycloakSuggestedIdentityProviderIdentifier,
        private readonly string $keycloakSuggestedIdentityProviderLabel
    ) {
    }

    #[Route('/login', name: 'app_login')]
    public function index(AuthenticationUtils $authenticationUtils): Response
    {
        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('login/index.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
            'keycloakEnabled' => $this->keycloakEnabled,
            'keycloakSuggestedIdentityProviderLabel' => $this->keycloakSuggestedIdentityProviderLabel,
        ]);
    }

    #[Route('/logout', name: 'app_logout')]
    public function logout(SessionInterface $session, TokenStorageInterface $tokenStorage, RouterInterface $router): Response
    {
        $tokenStorage->setToken(null);
        $session->clear();

        return new RedirectResponse($router->generate('app_logout'));
    }

    #[Route('/keycloak', name: 'app_keycloak')]
    public function keycloak(
        Request $request,
        SessionInterface $session,
        Keycloak $keycloakProvider,
        UserRepository $userRepository,
        Security $security,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $userPasswordHasher,
    ): Response {
        if (!$this->keycloakEnabled) {
            return new RedirectResponse('/login');
        }

        if (null === $request->query->get('code')) {
            $options = [];
            if ($this->keycloakSuggestedIdentityProviderIdentifier && '' !== $this->keycloakSuggestedIdentityProviderIdentifier) {
                $options['kc_idp_hint'] = $this->keycloakSuggestedIdentityProviderIdentifier;
            }

            $authUrl = $keycloakProvider->getAuthorizationUrl($options);
            $session->set('oauth2state', $keycloakProvider->getState());

            return new RedirectResponse($authUrl);
        } elseif (empty($request->query->get('state')) || ($request->query->get('state') !== $session->get('oauth2state'))) {
            $session->remove('oauth2state');

            return new Response('Invalid state, make sure HTTP sessions are enabled.', Response::HTTP_BAD_REQUEST);
        } else {
            try {
                $token = $keycloakProvider->getAccessToken('authorization_code', [
                    'code' => $request->query->get('code'),
                ]);
            } catch (Exception $e) {
                return new Response('Failed to get access token: '.$e->getMessage(), Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            try {
                $user = $keycloakProvider->getResourceOwner($token);
                $localUser = $userRepository->findOneBy(['email' => $user->getEmail()]);

                if (!$localUser instanceof User) {
                    $localUser = (new User())
                        ->setEmail($user->getEmail())
                        ->setEnabled(true)
                        ->setIsVerified(true)
                        ->setKeycloak(true)
                    ;
                    $localUser->setPassword(
                        $userPasswordHasher->hashPassword(
                            $localUser,
                            sha1(random_bytes(10))
                        )
                    );
                    $entityManager->persist($localUser);
                    $entityManager->flush();
                }
                $security->login($localUser);

                return new RedirectResponse('/');
            } catch (Exception $e) {
                return new Response('Failed to get resource owner: '.$e->getMessage(), Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
