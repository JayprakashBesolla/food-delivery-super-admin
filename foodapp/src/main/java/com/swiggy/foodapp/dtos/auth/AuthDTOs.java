package com.swiggy.foodapp.dtos.auth;

import com.swiggy.foodapp.entities.Role;

public class AuthDTOs {

    public static class RegisterRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
        private Role role = Role.CUSTOMER;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }

    public static class LoginRequest {
        private String usernameOrEmailOrPhone;
        private String password;

        public String getUsernameOrEmailOrPhone() { return usernameOrEmailOrPhone; }
        public void setUsernameOrEmailOrPhone(String usernameOrEmailOrPhone) { this.usernameOrEmailOrPhone = usernameOrEmailOrPhone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private Role role;

        public AuthResponse(String token, Long userId, String name, String email, String phone, Role role) {
            this.token = token;
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.role = role;
        }

        public String getToken() { return token; }
        public Long getUserId() { return userId; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
        public Role getRole() { return role; }
    }
}
