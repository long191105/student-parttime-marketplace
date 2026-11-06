package com.example.demo.dto;

import java.math.BigDecimal;
import java.util.List;

import com.example.demo.model.ListingCondition;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateListingRequest(
        @NotBlank @Size(min = 10, max = 150) String title,
        @NotBlank @Size(max = 80) String category,
        @NotNull @DecimalMin(value = "0.00") BigDecimal price,
        @NotNull ListingCondition condition,
        @NotBlank @Size(max = 160) String location,
        @NotBlank @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại cần có 10 hoặc 11 chữ số") String contactPhone,
        @NotBlank @Size(max = 7_000_000) String image,
        @Size(max = 10) List<@NotBlank @Size(max = 7_000_000) String> images,
        @NotBlank @Size(min = 20, max = 2000) String description,
        boolean negotiable,
        @Size(max = 20) List<@NotBlank @Size(max = 100) String> specs) {
}
