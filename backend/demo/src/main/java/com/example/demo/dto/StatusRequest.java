package com.example.demo.dto;

import com.example.demo.model.ListingStatus;

import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull ListingStatus status) {
}
