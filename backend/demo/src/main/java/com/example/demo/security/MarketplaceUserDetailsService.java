package com.example.demo.security;

import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.repository.UserAccountRepository;

@Service
public class MarketplaceUserDetailsService implements UserDetailsService {
	private final UserAccountRepository userRepository;

	public MarketplaceUserDetailsService(UserAccountRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		return userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
				.map(account -> User.withUsername(account.getEmail())
						.password(account.getPasswordHash())
						.roles(account.getRole().name())
						.build())
				.orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));
	}
}