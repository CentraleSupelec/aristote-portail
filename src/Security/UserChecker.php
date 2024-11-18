<?php

namespace App\Security;

use App\Entity\Administrator;
use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof Administrator && !$user instanceof User) {
            return;
        }

        if (!$user->getEnabled()) {
            throw new CustomUserMessageAccountStatusException("L'utilisateur n'a pas été activé");
        }

        if ($user instanceof User && !$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException("L'email de l'utilisateur n'a pas été vérifié");
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}
