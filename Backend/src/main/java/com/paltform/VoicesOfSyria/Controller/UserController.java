package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Dto.ChangePasswordRequest;
import com.paltform.VoicesOfSyria.Dto.UpdateProfileRequest;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    // الحصول على بيانات المستخدم الحالي
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            // إخفاء كلمة المرور
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("خطأ في جلب بيانات المستخدم");
        }
    }

    // تحديث بيانات البروفايل (الاسم وصورة البروفايل)
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User updatedUser = userService.updateProfile(email, request.getName(), request.getProfileImageUrl());
            // إخفاء كلمة المرور
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // تغيير كلمة المرور
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            boolean success = userService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());
            if (success) {
                return ResponseEntity.ok("تم تغيير كلمة المرور بنجاح");
            } else {
                return ResponseEntity.badRequest().body("كلمة المرور الحالية غير صحيحة");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
