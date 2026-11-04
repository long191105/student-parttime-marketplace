package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ListingResponse;
import com.example.demo.service.FavoriteService;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<ListingResponse> list() {
        return favoriteService.list();
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<Void> add(@PathVariable String listingId) {
        favoriteService.add(parseId(listingId));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> remove(@PathVariable String listingId) {
        favoriteService.remove(parseId(listingId));
        return ResponseEntity.noContent().build();
    }

    private static Long parseId(String id) {
        try {
            long parsed = Long.parseLong(id);
            if (parsed < 1) throw new NumberFormatException("ID must be positive");
            return parsed;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã tin đăng không hợp lệ.", exception);
        }
    }
}
