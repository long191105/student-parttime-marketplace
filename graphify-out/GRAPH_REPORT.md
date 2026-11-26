# Graph Report - student-parttime-marketplace  (2026-11-26)

## Corpus Check
- 171 files · ~251,547 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .woff2 10, (none) 8, .drawio 4)

## Summary
- 1833 nodes · 5086 edges · 75 communities (53 shown, 22 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 636 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebef5e57`
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
- ListingRepository
- lucide-react
- Favorite
- Listing
- ListingController.java
- Listing
- org.junit.jupiter.api.Test
- ListingReport
- UserNotificationService
- org.springframework.web.bind.annotation.GetMapping
- SecurityConfig.java
- ChatService
- CallIceServerService
- ChatWebSocketHandler
- CheckInPage.tsx
- MarketplaceLayout.tsx
- compilerOptions
- AdminController.java
- SellDropdown
- SearchPage.tsx
- ListingStatus
- ListingPhoneApiTest.java
- compilerOptions
- sloplint.mjs
- refcheck.mjs
- ChatWebSocketConfig.java
- DemoApplication.java
- SellPage.tsx
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
- ListingService.java
- AuthService.java
- clsLits
- twGroup
- picture.mjs
- org.springframework.http.ResponseEntity
- imagegen.mjs
- OtpEmailService
- checkTailwind
- .register
- AuthService
- install-hook.mjs
- interface
- tailwind-fail/Hero.tsx
- Category
- Feature.vue

## God Nodes (most connected - your core abstractions)
1. `UserAccount` - 105 edges
2. `report()` - 90 edges
3. `Listing` - 68 edges
4. `App()` - 63 edges
5. `MarketplaceApi` - 48 edges
6. `ChatService` - 45 edges
7. `trunc()` - 44 edges
8. `InboxPage()` - 43 edges
9. `resolveVars()` - 42 edges
10. `ChatServiceTest` - 41 edges

## Surprising Connections (you probably didn't know these)
- `handleSaveDraft()` --indirect_call--> `photos()`  [INFERRED]
  frontend/src/pages/SellPage.tsx → .agents/skills/hallmark/scripts/theme.mjs
- `ExplorePageProps` --references--> `Listing`  [EXTRACTED]
  frontend/src/pages/ExplorePage.tsx → frontend/src/domain/Listing.ts
- `SearchPageProps` --references--> `Listing`  [EXTRACTED]
  frontend/src/pages/SearchPage.tsx → frontend/src/domain/Listing.ts
- `handlePhotoChange()` --calls--> `uploadImagesToCloudinary()`  [EXTRACTED]
  frontend/src/pages/SellPage.tsx → frontend/src/services/CloudinaryUpload.ts
- `ChatWebSocketHandler` --references--> `JwtService`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/chat/ChatWebSocketHandler.java → backend/demo/src/main/java/com/example/demo/security/JwtService.java

## Import Cycles
- None detected.

## Communities (75 total, 22 thin omitted)

### Community 0 - "instant"
Cohesion: 0.07
Nodes (11): ListingDraftRequest, DraftPhoto, NotificationFeedResponse, UserNotificationResponse, ListingDraft, UserNotification, UserNotificationType, LISTING_APPROVED (+3 more)

### Community 2 - "ChatServiceTest.java"
Cohesion: 0.15
Nodes (3): UserRole, ADMIN, MEMBER

### Community 4 - "InboxPage"
Cohesion: 0.07
Nodes (47): ActiveCallState, CallHistoryMessage(), CallSignalEvent, CallState, ConnectionState, createCoordinatesMapUrl(), formatCallDuration(), formatLastActive() (+39 more)

### Community 5 - "UserAccount"
Cohesion: 0.11
Nodes (3): UserSummary, UserAccount, AuthControllerTest

### Community 6 - "App.tsx"
Cohesion: 0.07
Nodes (38): api, authenticationRequiredViews, ListingStatus, adminNavigation, AdminPage(), AdminPageProps, AdminTab, AttributeType (+30 more)

### Community 7 - "ChatService.java"
Cohesion: 0.08
Nodes (7): ChatController, ChatConversationResponse, ChatReviewRequest, ChatReviewResponse, ChatReviewStatusResponse, ChatReview, ChatReviewRepository

### Community 8 - "CategoryService"
Cohesion: 0.18
Nodes (3): CategoryController, CategoryResponse, CategoryService

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (34): devDependencies, eslint@^10.10.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.6, globals@^17.12.0, @types/node@^24.13.3, @types/react@^19.2.18 (+26 more)

### Community 10 - "ListingRepository"
Cohesion: 0.12
Nodes (7): ListingReportStatus, DISMISSED, OPEN, RESOLVED, ListingReportRepository, ListingRepository, ListingReportService

### Community 11 - "lucide-react"
Cohesion: 0.08
Nodes (25): HeroProps, dependencies, lucide-react@^1.48.0, react@^19.2.8, react-dom@^19.2.8, AppDialogContext, AppDialogContextValue, useAppDialog() (+17 more)

### Community 12 - "Favorite"
Cohesion: 0.19
Nodes (4): FavoriteController, Favorite, FavoriteRepository, FavoriteService

### Community 14 - "ListingController.java"
Cohesion: 0.17
Nodes (5): HealthController, HealthResponse, NotificationController, ReportController, CreateListingReportRequest

### Community 15 - "Listing"
Cohesion: 0.10
Nodes (6): ListingCardProps, Listing, FavoritesPageProps, ListingDetailPageProps, ProfilePageProps, MarketplaceService

### Community 16 - "org.junit.jupiter.api.Test"
Cohesion: 0.10
Nodes (4): CreateListingRequest, JwtServiceTest, ChatServiceTest, ListingServiceTest

### Community 17 - "ListingReport"
Cohesion: 0.17
Nodes (4): AdminReportResponse, ListingReportSubmittedResponse, ListingReport, ListingReportServiceTest

### Community 19 - "UserNotificationService"
Cohesion: 0.17
Nodes (3): ChatConversationRepository, ChatMessageRepository, UserNotificationService

### Community 20 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.20
Nodes (3): ListingController, ListingResponse, PhoneResponse

### Community 22 - "ChatService"
Cohesion: 0.12
Nodes (9): ChatMessageResponse, ChatConversation, ChatMessage, ChatMessageType, CALL, LOCATION, MISSED_CALL, TEXT (+1 more)

### Community 25 - "CheckInPage.tsx"
Cohesion: 0.14
Nodes (12): ChoHoiWordmark(), ChoHoiWordmarkProps, AuthPage(), AuthPageProps, CheckInPage(), CheckInPageProps, CheckInProgress, DAILY_REWARDS (+4 more)

### Community 26 - "MarketplaceLayout.tsx"
Cohesion: 0.15
Nodes (10): AppNavigationEntry, NavigationOptions, FloatingPromotions(), FloatingPromotionsProps, AppView, MarketplaceLayout(), MarketplaceLayoutProps, locations (+2 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 28 - "AdminController.java"
Cohesion: 0.14
Nodes (6): AdminController, CreateCategoryRequest, ProcessReportRequest, AdminStatsResponse, AdminUserResponse, RejectListingRequest

### Community 29 - "SellDropdown"
Cohesion: 0.20
Nodes (5): SellDropdown(), handleTriggerKeyDown(), openAt(), SellDropdownOption, SellDropdownProps

### Community 30 - "SearchPage.tsx"
Cohesion: 0.30
Nodes (11): SearchPage(), SearchPageProps, ApiProvince, getProvinceCodeIndex(), getProvinceWards(), isApiProvince(), isLocationOption(), isRecord() (+3 more)

### Community 31 - "ListingStatus"
Cohesion: 0.19
Nodes (8): StatusRequest, ListingStatus, ACTIVE, EXPIRED, HIDDEN, PENDING, REJECTED, SOLD

### Community 32 - "ListingPhoneApiTest.java"
Cohesion: 0.13
Nodes (4): ListingCondition, NEW, USED, ListingPhoneApiTest

### Community 33 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 34 - "sloplint.mjs"
Cohesion: 0.03
Nodes (72): ANSWERED, APP_SKIP, args, BUILD_DIRS, check25(), check62(), check76(), CHECKS (+64 more)

### Community 36 - "refcheck.mjs"
Cohesion: 0.04
Nodes (47): args, AS_JSON, BY_BASE, CANON, catalogFaces, clean, exemplarDir, expectations (+39 more)

### Community 40 - "SellPage.tsx"
Cohesion: 0.10
Nodes (21): categories, categoryImages, featuredCategoryImages, seedListings, ListingCondition, ListingData, ExplorePage(), ExplorePageProps (+13 more)

### Community 43 - "theme.mjs"
Cohesion: 0.09
Nodes (51): addLog(), ADJUST, args, ASK, BASE_CUSTOM, buildIndex(), check(), contrastOf() (+43 more)

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
Cohesion: 0.11
Nodes (31): App(), authenticationSucceeded(), changeStatus(), connectToBackend(), createListing(), editSavedDraft(), enterAdminRoute(), getCurrentNavigationEntry() (+23 more)

### Community 48 - "ref_node_fs"
Cohesion: 0.13
Nodes (10): globalRoot(), script, png, script, main(), OK(), script, dir (+2 more)

### Community 49 - "parseColor"
Cohesion: 0.11
Nodes (30): bannedGradient(), check2(), check29Glow(), check48(), check65(), check7(), firstFamily(), gradientHues() (+22 more)

### Community 50 - "ListingService"
Cohesion: 0.14
Nodes (5): ListingDraftRepository, CurrentUserService, ListingDraftService, ListingService, ListingDraftServiceTest

### Community 51 - "sloplint-render.mjs"
Cohesion: 0.18
Nodes (21): CHROMES, contrast(), focusRing(), frames(), hideStyles(), inventory(), isUrl(), lineBreaks() (+13 more)

### Community 52 - "capture.mjs"
Cohesion: 0.10
Nodes (15): argv, chrome, CHROMES, HERE, isUrl, made, out, roots (+7 more)

### Community 54 - "UserAccountRepository"
Cohesion: 0.19
Nodes (5): CategoryInitializer, CategoryRepository, PendingRegistrationRepository, UserAccountRepository, AdminAccountInitializer

### Community 55 - "install.mjs"
Cohesion: 0.13
Nodes (14): args, copyDir(), DRY, explicit, FLAGS, has(), HERE, HOME (+6 more)

### Community 56 - "ListingService.java"
Cohesion: 0.14
Nodes (8): UpdateUserStatusRequest, AccountStatus, ACTIVE, LOCKED, AdminReportAction, DISMISS, LOCK_USER, REMOVE_LISTING

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

### Community 66 - ".register"
Cohesion: 0.35
Nodes (3): MessageResponse, RegisterRequest, AuthServiceTest

### Community 67 - "AuthService"
Cohesion: 0.25
Nodes (3): AuthController, EmailRequest, AuthService

### Community 68 - "install-hook.mjs"
Cohesion: 0.22
Nodes (6): args, HERE, hookEntry, ourHook(), settings, withoutOurs()

### Community 70 - "interface"
Cohesion: 0.25
Nodes (7): dependencies, interface, default_prompts, display_name, short_description, policy, allow_implicit_invocation

### Community 72 - "tailwind-fail/Hero.tsx"
Cohesion: 0.33
Nodes (3): badge, Hero(), HeroProps

## Knowledge Gaps
- **26 isolated node(s):** `com.example:demo`, `ACTIVE`, `LOCKED`, `DISMISS`, `REMOVE_LISTING` (+21 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 465 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SellPage()` connect `SellPage.tsx` to `InboxPage`, `App.tsx`, `lucide-react`, `App`, `SellDropdown`, `SearchPage.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `com.example:demo`, `ACTIVE`, `LOCKED` to the rest of the system?**
  _26 weakly-connected nodes found - possible missing edges._
- **Should `instant` be split into smaller, more focused modules?**
  _Cohesion score 0.07326007326007326 - nodes in this community are weakly interconnected._
- **Why does `photos()` connect `theme.mjs` to `SellPage.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Should `MarketplaceApi` be split into smaller, more focused modules?**
  _Cohesion score 0.08412698412698413 - nodes in this community are weakly interconnected._
- **Why does `handleSaveDraft()` connect `SellPage.tsx` to `theme.mjs`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Should `InboxPage` be split into smaller, more focused modules?**
  _Cohesion score 0.07205513784461152 - nodes in this community are weakly interconnected._