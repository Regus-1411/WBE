package com.WMS.BE.repository;

import com.WMS.BE.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByApartmentId(Long apartmentId);

    List<User> findByApartmentIdAndRole(Long apartmentId, User.Role role);

    List<User> findByRole(User.Role role);

    List<User> findByApprovalStatus(User.ApprovalStatus approvalStatus);

    List<User> findByRoleAndApprovalStatus(User.Role role, User.ApprovalStatus approvalStatus);

    long countByRole(User.Role role);

    long countByApprovalStatus(User.ApprovalStatus approvalStatus);
}

