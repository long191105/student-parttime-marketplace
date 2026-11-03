package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectListingRequest(@NotBlank @Size(max = 500) String reason) {
}
