package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class UserService {

    private final UserRepo userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepo userRepository, JavaMailSender mailSender, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    // نخزّن المستخدمين مؤقتًا مع كود التحقق
    private final Map<String, User> pendingUsers = new HashMap<>();
    private final Map<String, String> verificationCodes = new HashMap<>();
    
    // أكواد إعادة تعيين كلمة السر
    private final Map<String, String> passwordResetCodes = new HashMap<>();

    // 1️⃣ إنشاء مستخدم مؤقت وإرسال الكود
    public String register(User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return "البريد الإلكتروني مستخدم مسبقاً!";
        }

        // تعيين الدور الافتراضي للمستخدم العادي
        user.setRole(UserRole.USER);

        // تعيين verified = false كبداية
        user.setVerified(false);

        // تشفير كلمة السر قبل تخزينها
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // إنشاء كود التحقق
        String code = generateVerificationCode();
        verificationCodes.put(user.getEmail(), code);
        pendingUsers.put(user.getEmail(), user);

        // إرسال الكود فعليًا
        sendVerificationEmail(user.getEmail(), code);

        return "تم إرسال رمز التحقق إلى بريدك الإلكتروني.";
    }

    // 2️⃣ التحقق من الكود وحفظ المستخدم فعليًا
    public boolean verifyEmail(String email, String code) {

        String savedCode = verificationCodes.get(email);
        if (savedCode == null || !savedCode.equals(code)) {
            return false;
        }

        User user = pendingUsers.get(email);
        if (user == null) {
            return false;
        }

        // يفتح حسابه الآن
        user.setVerified(true);

        // نحفظ المستخدم فعلياً بقاعدة البيانات
        userRepository.save(user);

        // إزالة البيانات المؤقتة
        pendingUsers.remove(email);
        verificationCodes.remove(email);

        return true;
    }

    private void sendVerificationEmail(String toEmail, String code) {
        String subject = "رمز التحقق من Voices of Syria";
        String text = "مرحباً!\n\nرمز التحقق الخاص بك هو: " + code +
                "\n\nيرجى إدخاله في الموقع لتفعيل حسابك.";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom("taymaaalhayek2003@gmail.com");

        mailSender.send(message);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    /**
     * Get all users with USER role
     */
    public List<User> getAllUsers() {
        return userRepository.findByRole(UserRole.USER);
    }

    /**
     * Get all users (all roles)
     */
    public List<User> getAllUsersAllRoles() {
        return userRepository.findAll();
    }

    /**
     * Get user by ID
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    /**
     * Get user by email
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Update user profile (name and profile image)
     */
    public User updateProfile(String email, String newName, String profileImageUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("المستخدم غير موجود"));
        
        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
        }
        
        if (profileImageUrl != null) {
            user.setProfileImageUrl(profileImageUrl);
        }
        
        return userRepository.save(user);
    }

    /**
     * Change user password
     */
    public boolean changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("المستخدم غير موجود"));
        
        // التحقق من كلمة المرور الحالية
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }
        
        // تشفير وحفظ كلمة المرور الجديدة
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    /**
     * Request password reset - sends verification code to email
     */
    public boolean requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false; // المستخدم غير موجود
        }
        
        // إنشاء كود التحقق
        String code = generateVerificationCode();
        passwordResetCodes.put(email, code);
        
        // إرسال الكود عبر البريد
        sendPasswordResetEmail(email, code);
        
        return true;
    }

    /**
     * Verify password reset code
     */
    public boolean verifyPasswordResetCode(String email, String code) {
        String savedCode = passwordResetCodes.get(email);
        return savedCode != null && savedCode.equals(code);
    }

    /**
     * Reset password with verification code
     */
    public boolean resetPassword(String email, String code, String newPassword) {
        // التحقق من الكود
        if (!verifyPasswordResetCode(email, code)) {
            return false;
        }
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }
        
        // تشفير وحفظ كلمة المرور الجديدة
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // إزالة الكود بعد الاستخدام
        passwordResetCodes.remove(email);
        
        return true;
    }

    private void sendPasswordResetEmail(String toEmail, String code) {
        String subject = "إعادة تعيين كلمة السر - Voices of Syria";
        String text = "مرحباً!\n\n" +
                "لقد طلبت إعادة تعيين كلمة السر الخاصة بك.\n\n" +
                "رمز التحقق الخاص بك هو: " + code + "\n\n" +
                "إذا لم تطلب هذا، يرجى تجاهل هذه الرسالة.\n\n" +
                "مع تحيات فريق Voices of Syria";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom("taymaaalhayek2003@gmail.com");

        mailSender.send(message);
    }
}
