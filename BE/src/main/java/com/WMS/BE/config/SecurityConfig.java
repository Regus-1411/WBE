package com.WMS.BE.config;

import com.WMS.BE.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/api/admin/notifications/**").permitAll()
                .requestMatchers("/api/superadmin/**").hasRole("MAIN_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/apartments/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/apartments/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/apartments/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/households/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/households/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/households/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/water-usage/**").hasAnyRole("APARTMENT_ADMIN", "MAIN_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
