package com.paltform.VoicesOfSyria.Config;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdmins();
    }

    private void createDefaultAdmins() {
        if (!userRepo.existsByRole(UserRole.SUPER_ADMIN)) {
            User superAdmin = createAdminUser(
                "superadmin@voicesofsyria.com",
                "Super Admin",
                "SuperAdmin123!",
                UserRole.SUPER_ADMIN
            );
            userRepo.save(superAdmin);
            log.info("Created default SUPER_ADMIN user: {}", superAdmin.getEmail());
        } else {
            log.info("SUPER_ADMIN user already exists");
        }

        if (!userRepo.existsByRole(UserRole.ADMIN)) {
            User admin = createAdminUser(
                "admin@voicesofsyria.com",
                "Admin",
                "Admin123!",
                UserRole.ADMIN
            );
            userRepo.save(admin);
            log.info("Created default ADMIN user: {}", admin.getEmail());
        } else {
            log.info("ADMIN user already exists");
        }

        if (!userRepo.existsByRole(UserRole.USER)) {
            User regularUser = createAdminUser(
                "user@voicesofsyria.com",
                "Regular User",
                "User123!",
                UserRole.USER
            );
            userRepo.save(regularUser);
            log.info("Created default USER: {}", regularUser.getEmail());
        } else {
            log.info("USER already exists");
        }
    }

    private User createAdminUser(String email, String name, String password, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setVerified(true);
        return user;
    }
}
