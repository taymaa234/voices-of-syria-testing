# Voices of Syria - Testing Guide

This document explains how to run all tests in the project.

---

## Prerequisites

- Java 17+
- Node.js 18+
- Maven (or use `./mvnw`)
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`

---

## 1. Unit Tests

Tests the `removeBookmark` method in `BookmarkService` using JUnit 5 + Mockito (no database, no Spring context).

**File:** `Backend/src/test/java/com/paltform/VoicesOfSyria/Service/BookmarkServiceTest.java`

```bash
cd Backend
./mvnw test -Dtest=BookmarkServiceTest
```

**What it tests:**
- Normal case: deleting an existing bookmark
- Edge case: deleting a non-existent bookmark (idempotent)
- Edge case: null userId or storyId
- Error case: repository throws exception
- Normal case: isBookmarked returns false after deletion
- Normal case: calling delete twice is idempotent

---

## 2. Integration Tests

Tests the `DELETE /api/bookmarks/{storyId}` endpoint using MockMvc + H2 in-memory database (real Spring context, real DB).

**File:** `Backend/src/test/java/com/paltform/VoicesOfSyria/Controller/BookmarkControllerIntegrationTest.java`

```bash
cd Backend
./mvnw test -Dtest=BookmarkControllerIntegrationTest -Dspring.profiles.active=test
```

**What it tests:**
- Normal case: DELETE returns 200 and removes bookmark from database
- Edge case: DELETE on non-existent bookmark returns 200 (idempotent)
- Error case: DELETE without JWT token returns 403
- Full flow: DELETE then GET /check returns `bookmarked: false`
- Edge case: DELETE with non-existent storyId returns 200

---

## 3. Run All Backend Tests

```bash
cd Backend
./mvnw test -Dspring.profiles.active=test
```

---

## 4. Performance Tests (k6)

Load tests the `GET /public/stories` endpoint with 50 concurrent users.

**File:** `Backend/performance-tests/stories-load-test.js`

**Prerequisites:**
- Install k6: `winget install k6 --source winget`
- Backend must be running on `http://localhost:8080`

```bash
k6 run Backend/performance-tests/stories-load-test.js
```

**Test profile:**
- Ramp up to 10 users over 30s
- Hold at 50 users for 1 minute
- Ramp down over 30s
- Threshold: 95% of requests under 500ms, error rate under 5%

---

## 5. E2E Tests (Playwright)

Automates the login flow through the browser UI.

**File:** `frontend/e2e/login.spec.js`

**Prerequisites:**
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`
- Install Playwright: `cd frontend && npm init playwright@latest`

```bash
cd frontend
npx playwright test e2e/login.spec.js --headed
```

**What it tests:**
- Successful login redirects to `/dashboard`
- Wrong credentials shows error message
- Empty fields prevents login

**Test credentials:** `user@voicesofsyria.com` / `User123!`

---

## 6. CI/CD Pipeline

The pipeline runs automatically on every push to `main` or `master`.

**File:** `.github/workflows/ci.yml`

**Stages:**
1. **Security Scan** - GitLeaks scans for leaked secrets
2. **Backend Tests** - Runs all JUnit unit & integration tests
3. **Deploy** - Placeholder deployment step

To set up the GitLeaks pre-commit hook locally:

```bash
# Windows
copy .github\hooks\pre-commit .git\hooks\pre-commit
```
