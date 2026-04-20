package com.paltform.VoicesOfSyria.Dto;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import lombok.Data;

@Data
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDto user;

    @Data
    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private UserRole role;
    }
}
