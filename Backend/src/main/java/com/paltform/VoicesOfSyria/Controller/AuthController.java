package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Dto.AuthResponse;
import com.paltform.VoicesOfSyria.Dto.LoginRequest;
import com.paltform.VoicesOfSyria.Dto.RefreshTokenRequest;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Service.AuthService;
import com.paltform.VoicesOfSyria.Service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    @Autowired
    private UserService userService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // الخطوة 1: إنشاء الحساب وإرسال كود التحقق
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        try {
            userService.register(user);
            return ResponseEntity.ok("تم إرسال رمز التحقق إلى بريدك الإلكتروني.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // الخطوة 2: إدخال رمز التحقق
    @PostMapping("/verify")
    public ResponseEntity<String> verifyUser(
            @RequestParam String email,
            @RequestParam String code) {
    
        boolean verified = userService.verifyEmail(email, code);
    
        if (verified) {
            return ResponseEntity.ok("تم التحقق من البريد الإلكتروني بنجاح!");
        } else {
            return ResponseEntity.badRequest().body("رمز التحقق غير صحيح أو منتهي الصلاحية.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Return a message body so the frontend can show the actual reason.
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // طلب إعادة تعيين كلمة السر
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("البريد الإلكتروني مطلوب.");
        }
        boolean sent = userService.requestPasswordReset(email);
        if (sent) {
            return ResponseEntity.ok("تم إرسال رمز التحقق إلى بريدك الإلكتروني.");
        } else {
            return ResponseEntity.badRequest().body("البريد الإلكتروني غير مسجل.");
        }
    }

    // التحقق من كود إعادة تعيين كلمة السر
    @PostMapping("/verify-reset-code")
    public ResponseEntity<String> verifyResetCode(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        boolean valid = userService.verifyPasswordResetCode(email, code);
        if (valid) {
            return ResponseEntity.ok("رمز التحقق صحيح.");
        } else {
            return ResponseEntity.badRequest().body("رمز التحقق غير صحيح أو منتهي الصلاحية.");
        }
    }

    // إعادة تعيين كلمة السر
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("password");
        if (newPassword == null) {
            newPassword = request.get("newPassword");
        }
        boolean reset = userService.resetPassword(email, code, newPassword);
        if (reset) {
            return ResponseEntity.ok("تم تغيير كلمة السر بنجاح!");
        } else {
            return ResponseEntity.badRequest().body("فشل في تغيير كلمة السر. تأكد من صحة الرمز.");
        }
    }
}
