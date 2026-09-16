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
            // Enable CORS with our config
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Disable CSRF (stateless JWT, no sessions)
            .csrf(csrf -> csrf.disable())
            // Stateless session — no server-side session
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — no token needed
                .requestMatchers("/api/auth/**").permitAll()

                // Admin-only write operations
                .requestMatchers("/api/admin/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/apartments/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/apartments/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/apartments/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/households/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/households/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/households/**").hasRole("APARTMENT_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/water-usage/**").hasRole("APARTMENT_ADMIN")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            // Register JWT filter before Spring's default auth filter
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
