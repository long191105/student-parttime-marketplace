package com.example.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.model.UserRole;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DemoApplicationTests {
	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void contextLoads() {
	}

	@Test
	void studentCanRegisterLoginAndReadOwnProfileWithJwt() throws Exception {
		String email = "student-" + UUID.randomUUID() + "@example.com";
		RegisterRequest registration = new RegisterRequest("Test Student", email, "secure-pass-123", UserRole.STUDENT);

		mockMvc.perform(get("/api/auth/me"))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/auth/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(registration)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.user.role").value("STUDENT"));

		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(new LoginRequest(email, "secure-pass-123"))))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode response = objectMapper.readTree(loginResult.getResponse().getContentAsString());
		String token = response.path("token").asText();

		mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(email));
	}

	@Test
	void publicRegistrationCannotCreateAdmin() throws Exception {
		RegisterRequest registration = new RegisterRequest(
				"Test Admin", "admin-" + UUID.randomUUID() + "@example.com", "secure-pass-123", UserRole.ADMIN);

		mockMvc.perform(post("/api/auth/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(registration)))
				.andExpect(status().isForbidden());
	}

	@Test
	void localViteOriginCanCallAuthApi() throws Exception {
		mockMvc.perform(options("/api/auth/register")
					.header("Origin", "http://127.0.0.1:5173")
					.header("Access-Control-Request-Method", "POST"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5173"));
	}

}
