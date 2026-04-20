package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Dto.AdminResponse;
import com.paltform.VoicesOfSyria.Dto.CreateAdminRequest;
import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminManagementService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminManagementService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Check if the current user is SUPER_ADMIN
     */
    private void validateSuperAdminAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }

        User currentUser = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        if (currentUser.getRole() != UserRole.SUPER_ADMIN) {
            throw new AccessDeniedException("Only SUPER_ADMIN can perform this operation");
        }
    }

    /**
     * Create a new ADMIN user
     */
    @Transactional
    public AdminResponse createAdmin(CreateAdminRequest request) {
        // Validate that only SUPER_ADMIN can create admins
        validateSuperAdminAccess();

        // Check if email already exists
        if (userRepo.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Create new admin user
        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword())); // Encrypt password
        admin.setProfileImageUrl(request.getProfileImageUrl());
        admin.setRole(UserRole.ADMIN); // Always set role to ADMIN
        admin.setVerified(true); // Admins created by SUPER_ADMIN are automatically verified
        admin.setVerificationCode(null); // No verification code needed

        User savedAdmin = userRepo.save(admin);

        // Convert to response DTO
        AdminResponse response = new AdminResponse();
        response.setId(savedAdmin.getId());
        response.setName(savedAdmin.getName());
        response.setEmail(savedAdmin.getEmail());
        response.setProfileImageUrl(savedAdmin.getProfileImageUrl());
        response.setRole(savedAdmin.getRole());
        response.setVerified(savedAdmin.isVerified());

        return response;
    }

    /**
     * Delete an existing ADMIN user
     */
    @Transactional
    public void deleteAdmin(Long adminId) {
        // Validate that only SUPER_ADMIN can delete admins
        validateSuperAdminAccess();

        // Find the admin user
        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found with ID: " + adminId));

        // Validate that the user is actually an ADMIN
        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("User with ID " + adminId + " is not an ADMIN");
        }

        // Delete the admin
        userRepo.delete(admin);
    }

    /**
     * Get all ADMIN users (for SUPER_ADMIN to view)
     */
    public List<AdminResponse> getAllAdmins() {
        // Validate that only SUPER_ADMIN can view admins
        validateSuperAdminAccess();

        List<User> admins = userRepo.findByRole(UserRole.ADMIN);

        return admins.stream().map(admin -> {
            AdminResponse response = new AdminResponse();
            response.setId(admin.getId());
            response.setName(admin.getName());
            response.setEmail(admin.getEmail());
            response.setProfileImageUrl(admin.getProfileImageUrl());
            response.setRole(admin.getRole());
            response.setVerified(admin.isVerified());
            return response;
        }).collect(Collectors.toList());
    }
}
