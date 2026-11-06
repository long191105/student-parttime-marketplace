package com.example.demo.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CreateListingRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.dto.PhoneResponse;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ListingRepository;

@Service
public class ListingService {

    private static final Pattern IMAGE_DATA_URL = Pattern.compile("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$");

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;

    public ListingService(
            ListingRepository listingRepository,
            CategoryRepository categoryRepository,
            CurrentUserService currentUserService) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public Page<ListingResponse> search(
            String keyword,
            String category,
            String location,
            String condition,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort,
            int page,
            int size) {
        validatePaging(page, size);
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá tối thiểu không thể lớn hơn giá tối đa.");
        }
        ListingCondition parsedCondition = parseCondition(condition);
        Pageable pageable = PageRequest.of(page, size, sortOrder(sort));
        String normalizedKeyword = blankToNull(keyword);
        String normalizedCategory = blankToNull(category);
        String normalizedLocation = blankToNull(location);
        Specification<Listing> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("status"), ListingStatus.ACTIVE));
            if (normalizedKeyword != null) {
                String pattern = "%" + normalizedKeyword.toLowerCase(Locale.ROOT) + "%";
                var searchableText = criteriaBuilder.lower(
                        criteriaBuilder.concat(
                                criteriaBuilder.concat(
                                        criteriaBuilder.concat(
                                                criteriaBuilder.concat(root.get("title"), " "),
                                                root.get("description")),
                                        " "),
                                criteriaBuilder.concat(
                                        criteriaBuilder.concat(root.get("category"), " "),
                                        root.get("location"))));
                predicates.add(criteriaBuilder.like(searchableText, pattern));
            }
            if (normalizedCategory != null) {
                predicates.add(criteriaBuilder.equal(root.get("category"), normalizedCategory));
            }
            if (normalizedLocation != null) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + normalizedLocation.toLowerCase(Locale.ROOT) + "%"));
            }
            if (parsedCondition != null) {
                predicates.add(criteriaBuilder.equal(root.get("condition"), parsedCondition));
            }
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        return listingRepository.findAll(specification, pageable).map(ListingResponse::from);
    }

    @Transactional
    public ListingResponse getActiveListing(Long id) {
        Listing listing = listingRepository.findById(id)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng."));
        listing.incrementViews();
        return ListingResponse.from(listing);
    }

    @Transactional(readOnly = true)
    public PhoneResponse getSellerPhone(Long id) {
        currentUserService.requireUser();
        Listing listing = listingRepository.findById(id)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng."));
        String phone = listing.getContactPhone();
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Người bán chưa cung cấp số điện thoại.");
        }
        return new PhoneResponse(phone);
    }

    @Transactional(readOnly = true)
    public Page<ListingResponse> getMyListings(String status, int page, int size) {
        validatePaging(page, size);
        UserAccount user = currentUserService.requireUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Listing> result;
        if (status == null || status.isBlank()) {
            result = listingRepository.findAllBySellerId(user.getId(), pageable);
        } else {
            result = listingRepository.findAllBySellerIdAndStatus(user.getId(), parseStatus(status), pageable);
        }
        return result.map(ListingResponse::from);
    }

    @Transactional
    public ListingResponse create(CreateListingRequest request) {
        UserAccount seller = currentUserService.requireUser();
        if (!categoryRepository.existsByNameIgnoreCase(request.category().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh mục không tồn tại hoặc đã bị tắt.");
        }
        validateImage(request.image());
        List<String> images = request.images() == null || request.images().isEmpty()
                ? List.of(request.image().trim())
                : request.images().stream().map(String::trim).toList();
        if (images.size() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi tin đăng chỉ được thêm tối đa 10 ảnh.");
        }
        if (!images.getFirst().equals(request.image().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh bìa phải là ảnh đầu tiên trong thư viện.");
        }
        images.forEach(ListingService::validateImage);
        String initials = initials(seller.getFullName());
        Listing listing = new Listing(
                request.title().trim(),
                request.category().trim(),
                request.price(),
                request.condition(),
                request.location().trim(),
                request.contactPhone().trim(),
                request.image().trim(),
                images,
                seller.getFullName(),
                initials,
                request.description().trim(),
                request.negotiable(),
                request.specs() == null ? "" : String.join("\n", request.specs()),
                seller);
        return ListingResponse.from(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponse updateStatus(Long id, ListingStatus requestedStatus) {
        if (requestedStatus != ListingStatus.ACTIVE
                && requestedStatus != ListingStatus.SOLD
                && requestedStatus != ListingStatus.HIDDEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái này không thể được chọn.");
        }
        UserAccount user = currentUserService.requireUser();
        Listing listing = listingRepository.findByIdAndSellerId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng của bạn."));
        if (listing.getStatus() == ListingStatus.PENDING
                || listing.getStatus() == ListingStatus.REJECTED
                || listing.getStatus() == ListingStatus.EXPIRED
                || (requestedStatus == ListingStatus.ACTIVE && listing.getStatus() != ListingStatus.HIDDEN && listing.getStatus() != ListingStatus.ACTIVE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tin đang chờ duyệt hoặc không thể đổi sang trạng thái này.");
        }
        if (listing.getStatus() != ListingStatus.ACTIVE && requestedStatus != ListingStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ tin đang hiển thị mới có thể được bán hoặc ẩn.");
        }
        listing.changeStatus(requestedStatus, null);
        return ListingResponse.from(listing);
    }

    @Transactional(readOnly = true)
    public Page<ListingResponse> adminSearch(String status, int page, int size) {
        validatePaging(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return listingRepository.findAllByStatus(parseStatus(status), pageable).map(ListingResponse::from);
    }

    @Transactional
    public ListingResponse moderate(Long id, ListingStatus status, String reason) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng."));
        if (listing.getStatus() != ListingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tin đăng này đã được xử lý.");
        }
        listing.changeStatus(status, reason);
        return ListingResponse.from(listing);
    }

    public Listing getListingForFavorite(Long id) {
        return listingRepository.findById(id)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng."));
    }

    public long countByStatus(ListingStatus status) {
        return listingRepository.countByStatus(status);
    }

    private static void validateImage(String image) {
        String value = image.trim();
        if (value.startsWith("https://")) return;
        if (IMAGE_DATA_URL.matcher(value).matches()) return;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh cần là URL HTTPS hoặc ảnh PNG/JPEG/WebP hợp lệ.");
    }

    private static void validatePaging(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phân trang không hợp lệ (size tối đa 100).");
        }
    }

    private static Sort sortOrder(String sort) {
        if ("price_asc".equalsIgnoreCase(sort) || "price-low".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "price");
        }
        if ("price_desc".equalsIgnoreCase(sort) || "price-high".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "price");
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private static ListingCondition parseCondition(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value) || "tất cả".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            String normalized = value.equalsIgnoreCase("new") || value.equalsIgnoreCase("mới") ? "NEW" : value;
            normalized = normalized.equalsIgnoreCase("used") || normalized.equalsIgnoreCase("đã sử dụng") ? "USED" : normalized;
            return ListingCondition.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tình trạng tin đăng không hợp lệ.", exception);
        }
    }

    private static ListingStatus parseStatus(String value) {
        try {
            return ListingStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái tin đăng không hợp lệ.", exception);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String initials(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase(Locale.ROOT);
        return (parts[parts.length - 2].substring(0, 1) + parts[parts.length - 1].substring(0, 1))
                .toUpperCase(Locale.ROOT);
    }
}
