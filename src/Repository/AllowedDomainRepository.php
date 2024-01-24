<?php

namespace App\Repository;

use App\Entity\AllowedDomain;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AllowedDomain>
 *
 * @method AllowedDomain|null find($id, $lockMode = null, $lockVersion = null)
 * @method AllowedDomain|null findOneBy(array $criteria, array $orderBy = null)
 * @method AllowedDomain[]    findAll()
 * @method AllowedDomain[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AllowedDomainRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $managerRegistry)
    {
        parent::__construct($managerRegistry, AllowedDomain::class);
    }
}
