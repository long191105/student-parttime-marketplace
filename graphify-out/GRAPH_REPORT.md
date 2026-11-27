# Graph Report - student-parttime-marketplace  (2026-11-27)

## Corpus Check
- 197 files · ~257,496 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .woff2 10, (none) 9, .css 4)

## Summary
- 1995 nodes · 5813 edges · 81 communities (50 shown, 31 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 835 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8af9ab1b`
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
- .create
- org.springframework.web.bind.annotation.PostMapping
- package.json
- ListingService
- SellPage.tsx
- Favorite
- Listing
- org.springframework.web.bind.annotation.RequestMapping
- Listing
- .requireUser
- ListingReport
- ChatWebSocketHandler.java
- org.springframework.data.domain.Page
- ListingController
- SecurityConfig.java
- ChatService
- org.springframework.transaction.annotation.Transactional
- ChatWebSocketHandler
- Category
- com.example.demo.model.UserAccount
- compilerOptions
- AdminController.java
- ChatService.java
- GoogleIdentityTokenVerifier.java
- ListingStatus
- ListingPhoneApiTest.java
- compilerOptions
- sloplint.mjs
- refcheck.mjs
- ListingDraft
- .from
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
- DemoApplication.java
- sloplint-render.mjs
- capture.mjs
- JwtService
- .from
- install.mjs
- UserAccountRepository
- AdminAccountInitializer.java
- clsLits
- twGroup
- picture.mjs
- org.springframework.http.ResponseEntity
- imagegen.mjs
- checkTailwind
- CallIceServerService.java
- lucide-react
- install-hook.mjs
- UserNotification
- interface
- tailwind-fail/Hero.tsx
- Feature.vue
- ListingServiceTest
- BrevoEmailService
- BrevoEmailService.java
- AuthResponse
- MarketplaceApi.ts
- FavoriteController
- ChatWebSocketConfig.java

## God Nodes (most connected - your core abstractions)
1. `UserAccount` - 133 edges
2. `report()` - 90 edges
3. `Listing` - 75 edges
4. `App()` - 69 edges
5. `MarketplaceApi` - 55 edges
6. `ListingService` - 47 edges
7. `ChatService` - 45 edges
8. `trunc()` - 44 edges
9. `ListingStatus` - 44 edges
10. `InboxPage()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `handleSaveDraft()` --indirect_call--> `photos()`  [INFERRED]
  frontend/src/pages/SellPage.tsx → .agents/skills/hallmark/scripts/theme.mjs
- `ChatWebSocketHandler` --references--> `JwtService`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/chat/ChatWebSocketHandler.java → backend/demo/src/main/java/com/example/demo/security/JwtService.java
- `ChatWebSocketHandler` --references--> `ChatService`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/chat/ChatWebSocketHandler.java → backend/demo/src/main/java/com/example/demo/service/ChatService.java
- `ChatWebSocketConfig` --references--> `ChatWebSocketHandler`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/config/ChatWebSocketConfig.java → backend/demo/src/main/java/com/example/demo/chat/ChatWebSocketHandler.java
- `CategoryInitializer` --references--> `CategoryRepository`  [EXTRACTED]
  backend/demo/src/main/java/com/example/demo/config/CategoryInitializer.java → backend/demo/src/main/java/com/example/demo/repository/CategoryRepository.java

## Import Cycles
- None detected.

## Communities (81 total, 31 thin omitted)

### Community 1 - "PendingRegistration"
Cohesion: 0.14
Nodes (7): MessageResponse, RegisterRequest, VerifyRegistrationRequest, PendingRegistration, PendingRegistrationRepository, AuthService, AuthServiceTest

### Community 2 - "ChatServiceTest.java"
Cohesion: 0.13
Nodes (5): PhoneResponse, UserRole, ADMIN, MEMBER, ListingModerationEmailListenerTest

### Community 4 - "InboxPage"
Cohesion: 0.10
Nodes (33): CallHistoryMessage(), createCoordinatesMapUrl(), formatLastActive(), formatRelativeTime(), formatTime(), InboxPage(), acceptCall(), applyPendingCandidates() (+25 more)

### Community 6 - "App.tsx"
Cohesion: 0.06
Nodes (34): api, AppNavigationEntry, authenticateWithGoogle(), authenticationRequiredViews, isAppView(), NavigationOptions, AppView, categories (+26 more)

### Community 8 - "org.springframework.web.bind.annotation.PostMapping"
Cohesion: 0.27
Nodes (3): ChatController, ChatConversationResponse, EmailRequest

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (34): devDependencies, eslint@^10.10.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.6, globals@^17.12.0, @types/node@^24.13.3, @types/react@^19.2.18 (+26 more)

### Community 10 - "ListingService"
Cohesion: 0.13
Nodes (10): ChatConversationRepository, ListingDraftRepository, ListingReportRepository, ListingRepository, CurrentUserService, ListingDraftService, ListingReportService, ListingService (+2 more)

### Community 11 - "SellPage.tsx"
Cohesion: 0.09
Nodes (29): ListingDetailPreview(), ListingDetailPreviewProps, PreviewPhoto, SellDropdown(), handleTriggerKeyDown(), openAt(), addReviewImages(), SearchPage() (+21 more)

### Community 12 - "Favorite"
Cohesion: 0.22
Nodes (3): Favorite, FavoriteRepository, FavoriteService

### Community 14 - "org.springframework.web.bind.annotation.RequestMapping"
Cohesion: 0.15
Nodes (7): AuthController, CategoryController, HealthController, HealthResponse, NotificationController, ReportController, CreateListingReportRequest

### Community 15 - "Listing"
Cohesion: 0.06
Nodes (26): AppDialogContextValue, useAppDialog(), ListingCard(), ListingCardProps, CategoryOption, seedListings, Listing, ListingCondition (+18 more)

### Community 17 - "ListingReport"
Cohesion: 0.15
Nodes (8): ProcessReportRequest, AdminReportResponse, ListingReportSubmittedResponse, AdminReportAction, DISMISS, LOCK_USER, REMOVE_LISTING, ListingReport

### Community 19 - "org.springframework.data.domain.Page"
Cohesion: 0.13
Nodes (4): ListingReportStatus, DISMISSED, OPEN, RESOLVED

### Community 21 - "SecurityConfig.java"
Cohesion: 0.11
Nodes (3): MarketplaceUserDetailsService, SecurityConfig, SecurityConfigTest

### Community 22 - "ChatService"
Cohesion: 0.17
Nodes (6): ChatMessage, ChatMessageType, CALL, LOCATION, MISSED_CALL, TEXT

### Community 23 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.12
Nodes (5): ChatMessageResponse, ChatReviewRequest, ChatReviewStatusResponse, ChatConversation, ChatService

### Community 25 - "Category"
Cohesion: 0.17
Nodes (3): CreateCategoryRequest, CategoryResponse, Category

### Community 26 - "com.example.demo.model.UserAccount"
Cohesion: 0.18
Nodes (6): UserProfileController, UpdateAvatarRequest, UserProfileResponse, UserFollow, UserFollowRepository, UserProfileService

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 31 - "ListingStatus"
Cohesion: 0.10
Nodes (8): ListingStatus, ACTIVE, DELETED, EXPIRED, HIDDEN, PENDING, REJECTED, SOLD

### Community 32 - "ListingPhoneApiTest.java"
Cohesion: 0.10
Nodes (11): ListingCondition, NEW, USED, UserNotificationType, LISTING_APPROVED, LISTING_REJECTED, NEW_MESSAGE, UserNotificationRepository (+3 more)

### Community 33 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 34 - "sloplint.mjs"
Cohesion: 0.03
Nodes (72): ANSWERED, APP_SKIP, args, BUILD_DIRS, check25(), check62(), check76(), CHECKS (+64 more)

### Community 36 - "refcheck.mjs"
Cohesion: 0.04
Nodes (47): args, AS_JSON, BY_BASE, CANON, catalogFaces, clean, exemplarDir, expectations (+39 more)

### Community 38 - "ListingDraft"
Cohesion: 0.26
Nodes (3): ListingDraftRequest, DraftPhoto, ListingDraft

### Community 39 - ".from"
Cohesion: 0.23
Nodes (5): UpdateUserStatusRequest, AdminUserResponse, AccountStatus, ACTIVE, LOCKED

### Community 40 - "uploadImagesToCloudinary"
Cohesion: 0.21
Nodes (9): ProfilePage(), changeAvatar(), ProfilePageProps, CloudinaryUploadError, SUPPORTED_TYPES, uploadImageToCloudinary(), validateCloudinaryImage(), ChatReview (+1 more)

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
Cohesion: 0.08
Nodes (33): App(), authenticationSucceeded(), changeStatus(), connectToBackend(), createListing(), editSavedDraft(), enterAdminRoute(), getCurrentNavigationEntry() (+25 more)

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

### Community 55 - "install.mjs"
Cohesion: 0.13
Nodes (14): args, copyDir(), DRY, explicit, FLAGS, has(), HERE, HOME (+6 more)

### Community 56 - "UserAccountRepository"
Cohesion: 0.21
Nodes (4): AdminController, CategoryRepository, UserAccountRepository, CategoryService

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

### Community 67 - "lucide-react"
Cohesion: 0.05
Nodes (34): HeroProps, dependencies, lucide-react@^1.48.0, react@^19.2.8, react-dom@^19.2.8, @react-oauth/google@^0.13.5, AppDialogContext, AppDialogProvider() (+26 more)

### Community 68 - "install-hook.mjs"
Cohesion: 0.22
Nodes (6): args, HERE, hookEntry, ourHook(), settings, withoutOurs()

### Community 69 - "UserNotification"
Cohesion: 0.15
Nodes (3): NotificationFeedResponse, UserNotificationResponse, UserNotification

### Community 70 - "interface"
Cohesion: 0.25
Nodes (7): dependencies, interface, default_prompts, display_name, short_description, policy, allow_implicit_invocation

### Community 72 - "tailwind-fail/Hero.tsx"
Cohesion: 0.33
Nodes (3): badge, Hero(), HeroProps

### Community 83 - "AuthResponse"
Cohesion: 0.31
Nodes (3): AuthResponse, GoogleLoginRequest, LoginRequest

### Community 86 - "MarketplaceApi.ts"
Cohesion: 0.09
Nodes (26): MarketplaceLayoutProps, ActiveCallState, CallSignalEvent, CallState, ConnectionState, formatCallDuration(), formatPrice(), InboxPageProps (+18 more)

## Knowledge Gaps
- **27 isolated node(s):** `com.example:demo`, `ACTIVE`, `LOCKED`, `DISMISS`, `REMOVE_LISTING` (+22 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 485 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SellPage()` connect `SellPage.tsx` to `theme.mjs`, `App.tsx`, `App`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `com.example:demo`, `ACTIVE`, `LOCKED` to the rest of the system?**
  _27 weakly-connected nodes found - possible missing edges._
- **Should `instant` be split into smaller, more focused modules?**
  _Cohesion score 0.13254901960784313 - nodes in this community are weakly interconnected._
- **Why does `handleSaveDraft()` connect `theme.mjs` to `SellPage.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `PendingRegistration` be split into smaller, more focused modules?**
  _Cohesion score 0.13732004429678848 - nodes in this community are weakly interconnected._
- **Should `ChatServiceTest.java` be split into smaller, more focused modules?**
  _Cohesion score 0.12943262411347517 - nodes in this community are weakly interconnected._
- **Should `MarketplaceApi` be split into smaller, more focused modules?**
  _Cohesion score 0.09365079365079365 - nodes in this community are weakly interconnected._