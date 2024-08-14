<?php

namespace App\Controller\Admin;

use App\Entity\User;
use Sonata\AdminBundle\Controller\CRUDController as Controller;
use Symfony\Component\HttpFoundation\RedirectResponse;

class UserAdminController extends Controller
{
    public function adminImpersonateAction(): RedirectResponse
    {
        /** @var User $subject */
        $subject = $this->admin->getSubject();

        return $this->redirectToRoute('app_home', [
            '_switch_user' => $subject->getEmail(),
        ]);
    }
}
