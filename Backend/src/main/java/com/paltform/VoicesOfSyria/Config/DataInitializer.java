package com.paltform.VoicesOfSyria.Config;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // إنشاء Super Admin إذا لم يكن موجوداً
        if (userRepo.findByEmail("superadmin@voicesofsyria.com").isEmpty()) {
            User superAdmin = new User();
            superAdmin.setName("Super Admin");
            superAdmin.setEmail("superadmin@voicesofsyria.com");
            superAdmin.setPassword(passwordEncoder.encode("SuperAdmin123!"));
            superAdmin.setVerified(true);
            superAdmin.setRole(UserRole.SUPER_ADMIN);
            userRepo.save(superAdmin);
            System.out.println("✅ Super Admin created: superadmin@voicesofsyria.com / SuperAdmin123!");
        }

        // إنشاء Admin إذا لم يكن موجوداً
        if (userRepo.findByEmail("admin@voicesofsyria.com").isEmpty()) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@voicesofsyria.com");
            admin.setPassword(passwordEncoder.encode("Admin123!"));
            admin.setVerified(true);
            admin.setRole(UserRole.ADMIN);
            userRepo.save(admin);
            System.out.println("✅ Admin created: admin@voicesofsyria.com / Admin123!");
        }

        // إنشاء User عادي إذا لم يكن موجوداً
        if (userRepo.findByEmail("user@voicesofsyria.com").isEmpty()) {
            User user = new User();
            user.setName("Test User");
            user.setEmail("user@voicesofsyria.com");
            user.setPassword(passwordEncoder.encode("User123!"));
            user.setVerified(true);
            user.setRole(UserRole.USER);
            userRepo.save(user);
            System.out.println("✅ User created: user@voicesofsyria.com / User123!");
        }
    }
}
