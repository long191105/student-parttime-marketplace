package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.ListingResponse;
import com.example.demo.model.Favorite;
import com.example.demo.model.Listing;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.FavoriteRepository;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ListingService listingService;
    private final CurrentUserService currentUserService;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            ListingService listingService,
            CurrentUserService currentUserService) {
        this.favoriteRepository = favoriteRepository;
        this.listingService = listingService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> list() {
        UserAccount user = currentUserService.requireUser();
        return favoriteRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Favorite::getListing)
                .map(ListingResponse::from)
                .toList();
    }

    @Transactional
    public void add(Long listingId) {
        UserAccount user = currentUserService.requireUser();
        if (favoriteRepository.existsByUserIdAndListingId(user.getId(), listingId)) return;
        Listing listing = listingService.getListingForFavorite(listingId);
        favoriteRepository.save(new Favorite(user, listing));
    }

    @Transactional
    public void remove(Long listingId) {
        UserAccount user = currentUserService.requireUser();
        favoriteRepository.findByUserIdAndListingId(user.getId(), listingId).ifPresent(favoriteRepository::delete);
    }
}
