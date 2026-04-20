package com.paltform.VoicesOfSyria.Dto;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import lombok.Data;

@Data
public class AdminResponse {
    private Long id;
    private String name;
    private String email;
    private String profileImageUrl;
    private UserRole role;
    private boolean verified;
}
