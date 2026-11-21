package com.example.demo.dto;

import java.util.List;

import com.example.demo.model.ListingCondition;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ListingDraftRequest(
        @Size(max = 150) String title,
        @Size(max = 80) String category,
        @Size(max = 50) String price,
        ListingCondition condition,
        @Size(max = 160) String location,
        @Size(max = 160) String fullLocation,
        @Size(max = 20) String districtCode,
        @Size(max = 20) String wardCode,
        @Size(max = 160) String detailAddress,
        @Size(max = 50) String phone,
        @Size(max = 2000) String description,
        boolean negotiable,
        boolean giveaway,
        @Size(max = 10) List<@NotNull @Valid DraftPhoto> photos,
        @Size(max = 100) String coverPhotoId,
        @Min(1) @Max(4) int activeStep) {

    public record DraftPhoto(
            @NotBlank @Size(max = 100) String id,
            @NotBlank @Size(max = 7_000_000) String src) {
    }
}
