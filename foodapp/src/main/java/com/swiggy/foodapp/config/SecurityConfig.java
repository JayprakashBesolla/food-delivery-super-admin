package com.swiggy.foodapp.config;

import com.swiggy.foodapp.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/restaurants/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/sectors/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/coupons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/*/receipt").permitAll()
                .requestMatchers("/api/upload/**", "/api/payment/webhook", "/api/payment/stripe/**").permitAll()
                .requestMatchers("/ws/**", "/uploads/**", "/error").permitAll()
                .requestMatchers("/api/admin/**", "/api/superadmin/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/work-queues/FINANCE/**").hasAnyRole("FINANCE_OFFICER", "FINANCE_MANAGER", "SUPER_ADMIN")
                .requestMatchers("/api/work-queues/OPERATIONS/**").hasAnyRole("OPERATIONS_OFFICER", "OPERATIONS_MANAGER", "SUPER_ADMIN")
                .requestMatchers("/api/work-queues/SUPPORT/**").hasAnyRole("SUPPORT_AGENT", "SUPPORT_MANAGER", "SUPER_ADMIN")
                .requestMatchers("/api/work-queues/**").hasAnyRole("SUPER_ADMIN", "FINANCE_OFFICER", "FINANCE_MANAGER", "OPERATIONS_OFFICER", "OPERATIONS_MANAGER", "SUPPORT_AGENT", "SUPPORT_MANAGER")
                .requestMatchers("/api/partner/**", "/api/store-admin/**").hasAnyRole("RESTAURANT_PARTNER", "SUPER_ADMIN")
                .requestMatchers("/api/rider/**").hasAnyRole("DELIVERY_PARTNER", "SUPER_ADMIN")
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
