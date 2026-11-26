# Graph Report - student-parttime-marketplace  (2026-11-27)

## Corpus Check
- 188 files · ~255,010 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .woff2 10, (none) 9, .css 4)

## Summary
- 1968 nodes · 5501 edges · 92 communities (55 shown, 37 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 723 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c370530`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- instant
- PendingRegistration
- ChatServiceTest.java
- MarketplaceApi
- InboxPage
- UserAccount
- App.tsx
- ChatService.java
- CategoryService
- package.json
- ListingReportRepository
- SellPage.tsx
- Favorite
- Listing
- ListingController.java
- Listing
- org.junit.jupiter.api.Test
- ListingReport
- ListingRepository
- org.springframework.web.bind.annotation.GetMapping
- SecurityConfig.java
- ChatService
- ChatService
- ChatWebSocketHandler
- CheckInPage.tsx
- com.example.demo.model.UserAccount
- compilerOptions
- AdminController.java
- SellDropdown
- SearchPage.tsx
- ListingStatus
- ListingPhoneApiTest.java
- compilerOptions
- sloplint.mjs
- ListingDraftRequest.java
- refcheck.mjs
- ChatWebSocketConfig.java
- DemoApplication.java
- uploadImagesToCloudinary
- tsconfig.json
- com.example:demo
- theme.mjs
- report
- resolveVars
- getAttr
- App
- ref_node_fs
- parseColor
- ListingService
- sloplint-render.mjs
- capture.mjs
- JwtService
- UserAccountRepository
- install.mjs
- AuthService.java
- clsLits
- twGroup
- picture.mjs
- org.springframework.http.ResponseEntity
- imagegen.mjs
- checkTailwind
- .requireUser
- react
- install-hook.mjs
- org.springframework.transaction.annotation.Transactional
- interface
- tailwind-fail/Hero.tsx
- org.springframework.stereotype.Service
- Feature.vue
- org.springframework.transaction.annotation.Transactional
- BrevoEmailService
- UserNotificationService
- .from
- UserAccountRepository
- org.slf4j.Logger
- SecurityConfigTest.java
- .currentUser
- ProfilePage.tsx
- HealthController
- FavoriteController
- ListingReportServiceTest

## God Nodes (most connected - your core abstractions)
1. `report()` - 90 edges
2. `UserAccount` - 90 edges
3. `Listing` - 75 edges
4. `App()` - 67 edges
5. `MarketplaceApi` - 53 edges
6. `ListingService` - 47 edges
7. `ChatService` - 45 edges
8. `trunc()` - 44 edges
9. `ListingStatus` - 44 edges
10. `InboxPage()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `handleSaveDraft()` --indirect_call--> `photos()`  [INFERRED]
  frontend/src/pages/SellPage.tsx → .agents/skills/hallmark/scripts/theme.mjs
- `ListingController` --references--> `ListingService`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/controller/ListingController.java → backend/demo/src/main/java/com/example/demo/service/ListingService.java
- `ChatConversation` --references--> `Listing`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/model/ChatConversation.java → backend/demo/src/main/java/com/example/demo/model/Listing.java
- `Favorite` --references--> `Listing`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/model/Favorite.java → backend/demo/src/main/java/com/example/demo/model/Listing.java
- `Listing` --references--> `ListingStatus`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/model/Listing.java → backend/demo/src/main/java/com/example/demo/model/ListingStatus.java

## Import Cycles
- None detected.

## Communities (92 total, 37 thin omitted)

### Community 0 - "instant"
Cohesion: 0.12
Nodes (8): NotificationFeedResponse, UserNotificationResponse, UserFollow, UserNotification, UserNotificationType, LISTING_APPROVED, LISTING_REJECTED, NEW_MESSAGE

### Community 1 - "PendingRegistration"
Cohesion: 0.12
Nodes (4): RegisterRequest, VerifyRegistrationRequest, PendingRegistration, PendingRegistrationRepository

### Community 2 - "ChatServiceTest.java"
Cohesion: 0.13
Nodes (6): PhoneResponse, UserRole, ADMIN, MEMBER, ListingDraftServiceTest, ListingModerationEmailListenerTest

### Community 4 - "InboxPage"
Cohesion: 0.07
Nodes (47): ActiveCallState, CallHistoryMessage(), CallSignalEvent, CallState, ConnectionState, createCoordinatesMapUrl(), formatCallDuration(), formatLastActive() (+39 more)

### Community 6 - "App.tsx"
Cohesion: 0.05
Nodes (43): api, AppNavigationEntry, authenticationRequiredViews, NavigationOptions, AppView, MarketplaceLayout(), MarketplaceLayoutProps, ScrollToTopButton() (+35 more)

### Community 7 - "ChatService.java"
Cohesion: 0.10
Nodes (5): ChatReviewRequest, ChatReviewResponse, ChatReviewStatusResponse, ChatReview, ChatReviewRepository

### Community 8 - "CategoryService"
Cohesion: 0.21
Nodes (3): CategoryController, CategoryResponse, CategoryService

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (34): devDependencies, eslint@^10.10.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.6, globals@^17.12.0, @types/node@^24.13.3, @types/react@^19.2.18 (+26 more)

### Community 10 - "ListingReportRepository"
Cohesion: 0.16
Nodes (3): AdminStatsResponse, ListingReportRepository, ListingReportService

### Community 11 - "SellPage.tsx"
Cohesion: 0.11
Nodes (20): useAppDialog(), ListingCard(), ListingDetailPreview(), ListingDetailPreviewProps, PreviewPhoto, FavoritesPage(), ListingDetailPage(), MyListingsPage() (+12 more)

### Community 12 - "Favorite"
Cohesion: 0.23
Nodes (3): Favorite, FavoriteRepository, FavoriteService

### Community 14 - "ListingController.java"
Cohesion: 0.15
Nodes (6): AuthController, NotificationController, ReportController, CreateListingReportRequest, EmailRequest, MessageResponse

### Community 15 - "Listing"
Cohesion: 0.07
Nodes (18): ListingCardProps, categoryImages, featuredCategoryImages, seedListings, Listing, ListingCondition, ListingData, ListingStatus (+10 more)

### Community 16 - "org.junit.jupiter.api.Test"
Cohesion: 0.12
Nodes (3): ChatMessageRepository, CallIceServerServiceTest, ChatServiceTest

### Community 17 - "ListingReport"
Cohesion: 0.16
Nodes (7): AdminReportResponse, ListingReportSubmittedResponse, ListingReport, ListingReportStatus, DISMISSED, OPEN, RESOLVED

### Community 22 - "ChatService"
Cohesion: 0.11
Nodes (7): ChatMessageResponse, ChatMessage, ChatMessageType, CALL, LOCATION, MISSED_CALL, TEXT

### Community 23 - "ChatService"
Cohesion: 0.17
Nodes (5): ChatController, ChatConversationResponse, ChatConversation, CallIceServerService, ChatService

### Community 25 - "CheckInPage.tsx"
Cohesion: 0.17
Nodes (13): ChoHoiWordmark(), ChoHoiWordmarkProps, CategoryOption, CheckInPage(), CheckInPageProps, CheckInProgress, DAILY_REWARDS, EMPTY_PROGRESS (+5 more)

### Community 26 - "com.example.demo.model.UserAccount"
Cohesion: 0.18
Nodes (5): UserProfileController, UserProfileResponse, UserFollowRepository, UserProfileService, UserProfileServiceTest

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 28 - "AdminController.java"
Cohesion: 0.12
Nodes (9): AdminController, CreateCategoryRequest, ProcessReportRequest, ListingResponse, RejectListingRequest, AdminReportAction, DISMISS, LOCK_USER (+1 more)

### Community 29 - "SellDropdown"
Cohesion: 0.20
Nodes (5): SellDropdown(), handleTriggerKeyDown(), openAt(), SellDropdownOption, SellDropdownProps

### Community 30 - "SearchPage.tsx"
Cohesion: 0.44
Nodes (9): ApiProvince, getProvinceCodeIndex(), getProvinceWards(), isApiProvince(), isLocationOption(), isRecord(), LocationOption, normalizeProvinceName() (+1 more)

### Community 31 - "ListingStatus"
Cohesion: 0.18
Nodes (9): StatusRequest, ListingStatus, ACTIVE, DELETED, EXPIRED, HIDDEN, PENDING, REJECTED (+1 more)

### Community 33 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 34 - "sloplint.mjs"
Cohesion: 0.03
Nodes (72): ANSWERED, APP_SKIP, args, BUILD_DIRS, check25(), check62(), check76(), CHECKS (+64 more)

### Community 35 - "ListingDraftRequest.java"
Cohesion: 0.16
Nodes (4): CreateListingRequest, ListingCondition, NEW, USED

### Community 36 - "refcheck.mjs"
Cohesion: 0.04
Nodes (47): args, AS_JSON, BY_BASE, CANON, catalogFaces, clean, exemplarDir, expectations (+39 more)

### Community 40 - "uploadImagesToCloudinary"
Cohesion: 0.33
Nodes (7): addReviewImages(), handlePhotoChange(), CloudinaryUploadError, SUPPORTED_TYPES, uploadImagesToCloudinary(), uploadImageToCloudinary(), validateCloudinaryImage()

### Community 43 - "theme.mjs"
Cohesion: 0.09
Nodes (52): addLog(), ADJUST, args, ASK, BASE_CUSTOM, buildIndex(), check(), contrastOf() (+44 more)

### Community 44 - "report"
Cohesion: 0.08
Nodes (40): applyWaivers(), appSkip(), baseGate(), check10(), check10Motion(), check11(), check15(), check17() (+32 more)

### Community 45 - "resolveVars"
Cohesion: 0.11
Nodes (39): baseSelector(), check1(), check11Lift(), check12(), check15Fade(), check23(), check24a(), check37() (+31 more)

### Community 46 - "getAttr"
Cohesion: 0.12
Nodes (35): accentedHeads(), accentedWordInHero(), ancestorMap(), capsRatio(), check28(), check3(), check30(), check33() (+27 more)

### Community 47 - "App"
Cohesion: 0.10
Nodes (34): App(), authenticationSucceeded(), changeStatus(), connectToBackend(), createListing(), editSavedDraft(), enterAdminRoute(), getCurrentNavigationEntry() (+26 more)

### Community 48 - "ref_node_fs"
Cohesion: 0.13
Nodes (10): globalRoot(), script, png, script, main(), OK(), script, dir (+2 more)

### Community 49 - "parseColor"
Cohesion: 0.11
Nodes (30): bannedGradient(), check2(), check29Glow(), check48(), check65(), check7(), firstFamily(), gradientHues() (+22 more)

### Community 51 - "sloplint-render.mjs"
Cohesion: 0.18
Nodes (21): CHROMES, contrast(), focusRing(), frames(), hideStyles(), inventory(), isUrl(), lineBreaks() (+13 more)

### Community 52 - "capture.mjs"
Cohesion: 0.10
Nodes (15): argv, chrome, CHROMES, HERE, isUrl, made, out, roots (+7 more)

### Community 53 - "JwtService"
Cohesion: 0.12
Nodes (3): JwtAuthenticationFilter, JwtService, JwtServiceTest

### Community 54 - "UserAccountRepository"
Cohesion: 0.17
Nodes (4): CategoryInitializer, Category, CategoryRepository, AdminAccountInitializer

### Community 55 - "install.mjs"
Cohesion: 0.13
Nodes (14): args, copyDir(), DRY, explicit, FLAGS, has(), HERE, HOME (+6 more)

### Community 59 - "clsLits"
Cohesion: 0.24
Nodes (16): braceEnd(), classCalls(), clsLits(), cutGlued(), jsxPseudo(), el(), js(), jsScan() (+8 more)

### Community 60 - "twGroup"
Cohesion: 0.15
Nodes (16): buildContext(), buildTokens(), check26(), check27(), check34(), checkF16(), importsOf(), linksOf() (+8 more)

### Community 61 - "picture.mjs"
Cohesion: 0.13
Nodes (11): chrome, CHROMES, cssPath, HERE, out, page, roots, [slug, pageArg, yArg] (+3 more)

### Community 63 - "imagegen.mjs"
Cohesion: 0.15
Nodes (7): args, hash, n, prompt, stem, steps, [w, h]

### Community 65 - "checkTailwind"
Cohesion: 0.23
Nodes (12): checkComponentText(), checkTailwind(), closeIndex(), compInner(), directChildren(), tw54(), tw67(), twDataText() (+4 more)

### Community 67 - "react"
Cohesion: 0.13
Nodes (11): HeroProps, dependencies, lucide-react@^1.48.0, react@^19.2.8, react-dom@^19.2.8, AppDialogContext, AppDialogContextValue, AppDialogProvider() (+3 more)

### Community 68 - "install-hook.mjs"
Cohesion: 0.22
Nodes (6): args, HERE, hookEntry, ourHook(), settings, withoutOurs()

### Community 70 - "interface"
Cohesion: 0.25
Nodes (7): dependencies, interface, default_prompts, display_name, short_description, policy, allow_implicit_invocation

### Community 72 - "tailwind-fail/Hero.tsx"
Cohesion: 0.33
Nodes (3): badge, Hero(), HeroProps

### Community 73 - "org.springframework.stereotype.Service"
Cohesion: 0.19
Nodes (4): ListingDraft, ListingDraftRepository, CurrentUserService, ListingDraftService

### Community 77 - "UserNotificationService"
Cohesion: 0.25
Nodes (3): UserNotificationRepository, UserNotificationService, UserNotificationServiceTest

### Community 78 - ".from"
Cohesion: 0.21
Nodes (5): UpdateUserStatusRequest, AdminUserResponse, AccountStatus, ACTIVE, LOCKED

### Community 83 - ".currentUser"
Cohesion: 0.22
Nodes (4): AuthResponse, LoginRequest, UserSummary, AuthControllerTest

### Community 86 - "ProfilePage.tsx"
Cohesion: 0.29
Nodes (4): ProfilePage(), ProfilePageProps, ChatReview, UserProfile

## Knowledge Gaps
- **27 isolated node(s):** `PENDING`, `ACTIVE`, `REJECTED`, `SOLD`, `HIDDEN` (+22 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 481 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SellPage()` connect `SellPage.tsx` to `App.tsx`, `uploadImagesToCloudinary`, `theme.mjs`, `App`, `SellDropdown`, `SearchPage.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `PENDING`, `ACTIVE`, `REJECTED` to the rest of the system?**
  _27 weakly-connected nodes found - possible missing edges._
- **Should `instant` be split into smaller, more focused modules?**
  _Cohesion score 0.1222921034241789 - nodes in this community are weakly interconnected._
- **Why does `handleSaveDraft()` connect `theme.mjs` to `SellPage.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `PendingRegistration` be split into smaller, more focused modules?**
  _Cohesion score 0.12233285917496443 - nodes in this community are weakly interconnected._
- **Should `ChatServiceTest.java` be split into smaller, more focused modules?**
  _Cohesion score 0.13386524822695037 - nodes in this community are weakly interconnected._
- **Should `MarketplaceApi` be split into smaller, more focused modules?**
  _Cohesion score 0.07560975609756097 - nodes in this community are weakly interconnected._