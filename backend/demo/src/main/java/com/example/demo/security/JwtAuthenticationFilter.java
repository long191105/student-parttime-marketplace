package com.example.demo.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.demo.model.UserAccount;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                String email = jwtService.extractSubject(token);
                UserAccount user = (UserAccount) userDetailsService.loadUserByUsername(email);
                if (jwtService.isValid(token, user.getEmail())) {
                    if (!user.isEnabled() && !isAllowedForLockedUser(request)) {
                        response.setStatus(HttpStatus.LOCKED.value());
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(
                                "{\"message\":\"Tài khoản đang bị khóa. Bạn chỉ có thể xem nội dung công khai và thông báo.\"}");
                        return;
                    }
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException | AuthenticationException exception) {
                logger.debug("Rejected invalid bearer token for {}.", request.getRequestURI(), exception);
            }
        }
        filterChain.doFilter(request, response);
    }

    static boolean isAllowedForLockedUser(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getServletPath();
        if ("OPTIONS".equals(method)) return true;
        if (HttpMethod.GET.matches(method)
                && ("/api/auth/me".equals(path)
                        || "/api/health".equals(path)
                        || "/api/categories".equals(path)
                        || "/api/listings".equals(path)
                        || path.matches("^/api/listings/[^/]+$")
                                && !"/api/listings/mine".equals(path)
                                && !"/api/listings/draft".equals(path)
                        || path.matches("^/api/users/\\d+/profile$"))) {
            return true;
        }
        return "/api/notifications".equals(path) && HttpMethod.GET.matches(method)
                || "/api/notifications/read-all".equals(path) && HttpMethod.PATCH.matches(method)
                || path.matches("^/api/notifications/\\d+/read$") && HttpMethod.PATCH.matches(method);
    }
}
