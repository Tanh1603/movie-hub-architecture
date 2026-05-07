# MASTER TEST PLAN: MOVIE HUB PLATFORM
**Version:** 1.0
**Date:** January 4, 2026
**Standard:** IEEE 829-2008

---

## 2. REFERENCES

The following documents support the test planning and execution for the Movie Hub platform. These references point to artifacts currently stored in the project's version control system and documentation directories.

**Requirements Specifications**
*   **Software Requirements Specification (SRS):** `project_documentation_v1_1st_Dec/SRS_MOVIE_PLATFORM.md`
*   **Feature List:** `project_documentation_v1_1st_Dec/FEATURES.md`
*   **Functional Specifications:** Module-specific specifications located in `functional_specs/` (including `3.1_User_Management`, `3.5.1_User_Booking_Operations`, etc.)
*   **Requirements Traceability Matrix (RTM):** `project_documentation_v1_1st_Dec/RTM_MOVIE_PLATFORM.csv`

**Design and Architecture**
*   **High-Level Architecture:** `project_documentation_v1_1st_Dec/ARCHITECTURE.md`
*   **API Contract/Interface Specifications:** `project_documentation_v1_1st_Dec/API_CONTRACT.md`
*   **Specific Logic Flows:** `seat-realtime-flow.md`
*   **Database Design:** Prisma schema definitions located in `apps/[service-name]/prisma/schema.prisma` (for Booking, Cinema, Movie, and User services).

**Test Documentation and Standards**
*   **Project Testing Guidelines:** `TESTING.md`
*   **Unit Testing Documentation:** `cinema_unit.md`, `cinema_location_unit.md`
*   **Detailed Test Cases:** `project_documentation_v1_1st_Dec/TestCase_Detailed.csv`
*   **IEEE Standard:** IEEE 829-2008 Standard for Software and System Test Documentation

**Project Management**
*   **Project Overview/Report:** `project_documentation_v1_1st_Dec/REPORT.md`
*   **Project Readme:** `README.md`

**Development Standards**
*   **Linting & Formatting:** `eslint.config.mjs`, `.prettierrc`
*   **CI/CD Configuration:** `.github/workflows/ci.yml`

---

## 3. INTRODUCTION

### 3.1 Purpose
This Master Test Plan (MTP) defines the overall testing strategy, objectives, and scope for the **Movie Hub** platform. It serves as the governing document for all verification and validation activities across the application's lifecycle, ensuring the system meets the functional requirements outlined in the `SRS_MOVIE_PLATFORM.md` and quality standards defined in the project architecture. This plan coordinates testing efforts across the microservices architecture (User, Movie, Cinema, Booking, API Gateway) and the Web client.

### 3.2 Scope
The scope of this test plan encompasses the full software development lifecycle of the Movie Hub project. It specifically covers:
*   **Unit Testing:** Verification of individual components within the NestJS microservices and Next.js frontend, as detailed in `cinema_unit.md` and `cinema_location_unit.md`.
*   **Integration Testing:** Validation of interactions between microservices (e.g., Booking Service communicating with Cinema Service) and database interactions via Prisma.
*   **End-to-End (E2E) Testing:** Validation of critical user flows, such as Real-time Seat Selection and Payment Transactions (`3.5.3_Real-time_Seat_Selection` and `3.6_Payment_Transaction_Module`).
*   **System Testing:** Verification of the deployed system within the Docker/Azure environment.

**Out of Scope:**
*   Third-party payment gateway internal testing (mocked for this project).
*   Deep performance/load testing beyond basic concurrency limits defined in non-functional requirements.

### 3.3 Evaluation & Coordination
Testing activities are integrated directly into the CI/CD pipeline managed via GitHub Actions (`.github/workflows/ci.yml`). Code quality is enforced via static analysis tools (ESLint, Prettier) prior to execution of test suites. Discrepancies and defects will be tracked via the project's issue tracking system (GitHub Issues/Jira).

### 3.4 Constraints & Assumptions
*   **Resource Constraints:** Testing is limited to the available development team members and the timeline of the Semester 1 Year 3 project schedule.
*   **Environment:** Testing assumes a stable Docker environment for local execution and Azure availability for staging.
*   **Data:** Synthetic seed data (`synthetic_seed_data/`) will be used to populate test environments to ensure consistent baselines.

---

## 4. TEST ITEMS (FUNCTIONS)

The following software elements and functional areas constitute the test items for the Movie Hub platform. These items represent the core deliverables to be validated against the requirements defined in the `SRS_MOVIE_PLATFORM.md`.

Testing will be performed on the latest build revision from the `main` branch of the version control system.

### 4.1 Application Modules (Microservices)

The following backend microservices, managed via the Nx workspace, are primary test items. Each service includes its specific business logic, database interactions (Prisma), and API endpoints.

| Test Item ID | Component Name | Description | Related Functional Specs |
| :--- | :--- | :--- | :--- |
| **TI-001** | **User Service** | Manages authentication (Clerk integration), user profiles, roles (Admin/User), and loyalty points. | `3.1_User_Management`, `3.11_Loyalty_Points_Module` |
| **TI-002** | **Movie Service** | Handles the movie catalog, new releases, genre management, and user reviews/ratings. | `3.3.1_Movie_Catalog`, `3.3.2_Movie_Releases`, `3.3.4_Movie_Reviews` |
| **TI-003** | **Cinema Service** | Manages cinema locations, hall layouts, seat configurations, and showtime scheduling. | `3.2.1_Cinema_Management`, `3.4_Showtime_Scheduling` |
| **TI-004** | **Booking Service** | Handles the core booking lifecycle: seat reservation, real-time status updates (Redis), ticket generation, and refunds. | `3.5.1_User_Booking_Operations`, `3.5.3_Real-time_Seat_Selection`, `3.8_Refund_Management_Module` |
| **TI-005** | **API Gateway** | The central entry point for all client requests, handling routing, aggregation, and initial request validation. | *All System Interfaces* |

### 4.2 User Interfaces (Frontend)

The frontend application provides the interface for both end-users and administrators.

| Test Item ID | Component Name | Description | Related Functional Specs |
| :--- | :--- | :--- | :--- |
| **TI-006** | **Web Client (Public)** | The Next.js application view for customers to browse movies, select seats, and manage bookings. | `3.5.1_User_Booking_Operations` |
| **TI-007** | **Admin Dashboard** | The protected area within the Web Client for system configuration, movie scheduling, and reporting. | `3.5.2_Admin_Booking_Operations`, `3.12_System_Configuration_Module` |

### 4.3 Key Functional Processes

In addition to component-level testing, the following cross-cutting functional flows are critical test items:

*   **Authentication & Authorization Flow:** Verification of secure access control across all services.
*   **Real-time Seat Locking:** Validation of concurrency handling when multiple users attempt to book the same seat simultaneously (utilizing Redis).
*   **Payment Integration:** Verification of payment processing and status updates (Success/Failure handling).
*   **Search & Filtering:** Validation of search algorithms for movies based on genre, title, or date.

### 4.4 Exclusions (Not Tested)

The following items are outside the scope of this test plan:
*   Internal functionality of the third-party **Clerk** authentication provider (only the integration is tested).
*   Internal banking networks for payment processing (Mock gateways will be used).

---

## 5. SOFTWARE RISK ISSUES

This section identifies software-specific risks associated with the Movie Hub platform. These risks focus on the complexity of functions, dependency on external systems, and architectural challenges inherent in a microservices environment.

### 5.1 Critical Functional Areas (Complexity & Reliability)

*   **Real-time Seat Selection & Concurrency (High Risk):**
    *   **Description:** The "Real-time Seat Selection" module (`3.5.3` and `seat-realtime-flow.md`) requires precise synchronization between the Client, Redis Cache, and the PostgreSQL database.
    *   **Risk:** High probability of race conditions where two users book the same seat simultaneously (Double Booking). State desynchronization between Redis (temporary lock) and the persistent database (final booking) is a critical failure mode.
    *   **Mitigation Strategy:** Intensive concurrency testing and stress testing using `libs/shared-redis` to simulate high-load locking scenarios.

*   **Distributed Transaction Integrity (Medium Risk):**
    *   **Description:** A single booking event spans multiple services: Booking Service (reservation), User Service (loyalty points), and Cinema Service (seat availability).
    *   **Risk:** Partial failures (e.g., payment succeeds but seat booking fails) could leave data in an inconsistent state across the distributed Prisma databases.
    *   **Mitigation Strategy:** Integration testing focusing on rollback scenarios and eventual consistency checks.

### 5.2 External Interfaces & Dependencies

*   **Third-Party Authentication (Clerk) (Medium Risk):**
    *   **Description:** The system relies entirely on Clerk (`CLERK_SETUP_GUIDE.md`) for identity management.
    *   **Risk:** Changes to the Clerk API or downtime in the external service effectively locks out all users.
    *   **Mitigation Strategy:** Implementation of robust error handling in the `User Service` and `Web Client` to handle authentication timeouts gracefully.

*   **Payment Gateway Integration (Medium Risk):**
    *   **Description:** The `Payment Transaction Module` (`3.6`) interfaces with external payment providers (simulated or real).
    *   **Risk:** Handling of webhooks for asynchronous payment success/failure notifications is complex and often a source of defects (e.g., missed webhooks resulting in unconfirmed bookings).
    *   **Mitigation Strategy:** Mock testing of webhook delays and failures.

### 5.3 Architectural & Environment Risks

*   **API Gateway Bottleneck (Medium Risk):**
    *   **Description:** All traffic flows through the `apps/api-gateway`.
    *   **Risk:** If the Gateway is misconfigured or overwhelmed, all downstream services (Movie, Cinema, Booking) become unreachable.
    *   **Mitigation Strategy:** Validation of routing logic and rate-limiting configurations.

*   **Containerization & Orchestration (Low Risk):**
    *   **Description:** The project relies heavily on Docker (`docker-compose.yml`) for local development and deployment.
    *   **Risk:** Discrepancies between the local Docker environment and the production container runtime (Azure/Kubernetes) may lead to "works on my machine" defects, particularly regarding network resolution between services.
    *   **Mitigation Strategy:** Strict adherence to `LOCAL_DOCKER_GUIDE.md` and automated deployment tests via `.github/workflows/deploy.yml`.

### 5.4 Requirements & Scope Risks

*   **Ambiguity in Business Logic:**
    *   **Description:** Modules like `3.10 Promotions_Discounts` and `3.11 Loyalty_Points` often have edge cases (e.g., applying multiple discounts) that may not be fully defined in the SRS.
    *   **Risk:** Developer interpretation of vague requirements leading to logic errors.
    *   **Mitigation Strategy:** Clarification of edge cases during the Design Phase and review of `functional_specs` prior to test case creation.

---

## 6. FEATURES TO BE TESTED

The following features will be validated from the end-user's perspective. The risk ratings (High, Medium, Low) reflect the criticality of the feature to the business operation and the complexity of its implementation.

| Feature Name | Description | Risk | Rationale for Risk Rating |
| :--- | :--- | :--- | :--- |
| **User Registration & Login** | Verification that users can sign up, log in, and reset passwords via the interface (powered by Clerk). | **H** | Critical entry point. If this fails, no other features are accessible. High reliance on 3rd-party integration. |
| **Movie Browsing & Search** | Validation that users can view currently showing and upcoming movies, and filter them by genre or date. | **M** | Core discovery feature. Failure here directly impacts revenue (users can't find what to book), though logic is less complex. |
| **View Movie Details** | Verification that users can see movie descriptions, cast, ratings, and showtimes. | **L** | Static information display with low complexity. |
| **Real-Time Seat Selection** | Ensuring users can view the cinema hall layout and select available seats. Seats selected by others must be locked instantly. | **H** | **Critical Business Function.** High complexity due to real-time concurrency requirements and potential for double-booking errors. |
| **Ticket Booking & Checkout** | The complete flow of confirming seats, calculating total price (including taxes/booking fees), and initiating payment. | **H** | Direct revenue generation. Errors here result in financial loss or user frustration. |
| **Payment Processing** | Confirmation that payments (mock or real) are processed correctly and booking status updates to "Confirmed". | **H** | Involves financial transactions and secure data handling. High impact of failure. |
| **Booking History & E-Ticket** | Users can view their past and upcoming bookings and access their digital QR code/ticket. | **M** | Essential for user proof-of-purchase. Medium complexity involving data retrieval. |
| **Admin: Cinema Management** | Administrators can add/edit cinema locations, halls, and seat layouts. | **M** | Operational necessity. Errors here propagate to the customer-facing seat selection, causing data issues. |
| **Admin: Showtime Scheduling** | Administrators can schedule movies for specific times in specific halls. | **M** | Logic-heavy (avoiding conflicts/overlap of movies in the same hall). |
| **Reviews & Ratings** | Users can leave text reviews and star ratings for movies. | **L** | Ancillary feature. Failure does not block core business revenue. |
| **Loyalty Points System** | Verification that points are awarded after booking and can be viewed in the user profile. | **L** | Value-add feature. Lower priority than core booking functions. |

---

## 7. FEATURES NOT TO BE TESTED

The following features and system attributes are excluded from the scope of this Master Test Plan. These exclusions are based on current project priorities, risk assessments, and the boundaries of the development environment.

| Feature / Component | Reason for Exclusion |
| :--- | :--- |
| **User Registration (Internal Logic)** | **Third-Party Reliability:** The actual registration, password encryption, and email verification logic is managed by **Clerk**. We test the *integration* (success/failure response), but we do not test Clerk's internal authentication algorithms or infrastructure. |
| **Real Payment Processing** | **Environment Limitation:** Testing will use a "Sandbox" or "Mock" payment gateway. Actual credit card processing, bank settlement, and PCI-DSS compliance validation are not possible in the development/staging environment. |
| **Mobile Application Interface** | **Out of Scope:** The current release focuses strictly on the Web Client (Next.js). Responsive design for mobile browsers will be checked, but native mobile app functionality is not part of this release. |
| **Legacy Data Migration** | **New System:** This is a greenfield project (`v1.0`). There is no legacy data from a previous system to migrate or validate. |
| **Multi-Language Support (I18n)** | **Deferred Feature:** The application is currently designed for English (en-US) only. Localization testing is deferred to a future release (v2.0). |
| **Physical Hardware Integration** | **Out of Scope:** Integration with physical cinema hardware (POS terminals, physical ticket printers, turnstiles) is not supported in this software-only project scope. |
| **High-Load Performance (DDoS)** | **Resource Constraints:** While basic concurrency is tested, large-scale Distributed Denial of Service (DDoS) simulations or massive load testing (10,000+ concurrent users) is outside the scope of the current testing infrastructure. |

---

## 8. APPROACH (STRATEGY)

This section outlines the overall testing strategy for the Movie Hub platform, ensuring comprehensive coverage from individual units to full system integration. The strategy leverages the project's modern tech stack (Nx, NestJS, Next.js, Docker) to automate verification wherever possible.

### 8.1 Testing Levels & Methodology

The project adopts a "Shift-Left" testing approach, emphasizing early defect detection.

1.  **Unit Testing (Automated):**
    *   **Scope:** Individual functions, services, and components within Microservices (Booking, Cinema, Movie, User) and the API Gateway.
    *   **Tools:** `Jest` (Configured in `jest.config.ts` for each app).
    *   **Coverage Target:** >80% code coverage for core business logic.
    *   **Execution:** Automated via CI pipeline (`.github/workflows/ci.yml`) on every Pull Request.

2.  **Integration Testing (Automated):**
    *   **Scope:** Interactions between services (e.g., Booking Service calling Cinema Service) and database persistence (Prisma/PostgreSQL).
    *   **Tools:** `Jest` with `Supertest` for API endpoints; `Testcontainers` or Dockerized services for database isolation.
    *   **Strategy:** Verify that contracts defined in `API_CONTRACT.md` are honored.

3.  **End-to-End (E2E) Testing (Automated/Manual):**
    *   **Scope:** Full user journeys (e.g., "User logs in -> Browses Movie -> Selects Seat -> Pays -> Gets Ticket").
    *   **Tools:** `Playwright` or `Cypress` (indicated by `api-gateway-e2e` and functional specs).
    *   **Environment:** Staging environment replicating production (Docker Compose).

4.  **Manual / Exploratory Testing:**
    *   **Scope:** UX flow, visual alignment, and edge cases not easily automated (e.g., specific concurrent seat locking timing).
    *   **Strategy:** Ad-hoc testing by QA engineers using the `postman/Complete Collection.json` for API verification and the Web Client for UI verification.

### 8.2 Tools & Training

| Tool | Purpose | Training Required |
| :--- | :--- | :--- |
| **Jest** | Unit and Integration testing framework. | Standard JS/TS knowledge. |
| **Nx Cloud** | Build and test caching/orchestration. | Minimal (configuration is pre-set). |
| **Postman** | API manual testing and verification. | Basic API knowledge. |
| **Docker** | Containerization for consistent test environments. | Basic Docker CLI knowledge. |
| **GitHub Actions** | CI/CD automation. | DevOps/Lead Developer only. |

### 8.3 Metrics & Data Collection

Metrics will be collected automatically via the CI/CD pipeline and reported in the `build_log.txt` or GitHub Actions summary.

*   **Test Pass/Fail Rate:** Collected at Unit and E2E levels.
*   **Code Coverage:** % of lines/branches covered (Target: >80%).
*   **Defect Density:** Number of bugs found per feature module (tracked in GitHub Issues).
*   **Regression Severity:** Count of Critical/High defects reintroduced in new builds.

### 8.4 Configuration Management & Environments

Configuration is managed via Git and environment variables (`.env`).

*   **Development (Local):** Developers run tests against local Docker containers (`docker-compose.yml`).
*   **CI (GitHub Actions):** Ephemeral containers created for every PR to run the full test suite.
*   **Staging:** A persistent environment on Azure (managed by `deploy.yml`) for final manual acceptance testing.

**Configurations to Test:**
*   **Browser:** Chrome (Latest), Firefox (Latest), Edge (Latest).
*   **OS:** Cross-platform functionality (Windows/Linux/macOS) is handled by the Dockerized backend; Frontend is browser-dependent.

### 8.5 Regression Testing

Regression testing is fully automated.
*   **Trigger:** Every commit to the `main` branch or opening of a Pull Request.
*   **Scope:** The entire `Jest` suite (Unit + Integration) runs automatically.
*   **Severity:** Any regression (regardless of severity) blocks the merge/deployment process. The build will fail if *any* test fails.

### 8.6 Handling Untestable Requirements

Requirements that are vague, ambiguous, or technically untestable (e.g., "The system shall be easy to use") will be:
1.  Flagged during the Requirement Review phase.
2.  Clarified with the Stakeholders/Product Owner.
3.  Converted into quantifiable metrics (e.g., "User shall complete booking in < 3 minutes") or moved to a "User Acceptance" checklist rather than a formal functional test.

### 8.7 Process & Meetings

*   **Test Planning:** Integrated into Sprint Planning.
*   **Defect Review:** Weekly "Bug Triage" meetings to prioritize new issues.
*   **Sign-off:** Required from the QA Lead before any release to the Staging environment.

---

## 9. ITEM PASS/FAIL CRITERIA

This section defines the precise criteria used to determine whether a specific test item (Section 4) or the entire software release is ready for progression to the next stage or for final delivery.

### 9.1 Unit & Integration Level Criteria (Automated)

For individual microservices (User, Movie, Cinema, Booking) and the Web Client:

*   **Execution:** 100% of all defined Unit and Integration tests (via `Jest`) must run to completion.
*   **Success Rate:** 100% Pass rate. No failing tests are permitted for a build to be considered "Green."
*   **Code Coverage:**
    *   **Statements:** > 80%
    *   **Branches:** > 75%
    *   **Functions:** > 80%
    *   *Note:* Coverage reports are generated automatically by the CI pipeline.
*   **Linting/Formatting:** Must pass `eslint` and `prettier` checks with zero errors.

### 9.2 System & End-to-End (E2E) Level Criteria

For the complete application flow (verified in the Staging/Docker environment):

*   **Critical User Journeys:** 100% of "Critical" priority test cases (e.g., Login, Real-time Booking, Payment) must pass.
*   **Regression:** 0% regression in existing features (verified by automated E2E suite).
*   **Performance:**
    *   API Response time < 500ms for 95% of requests (excluding external payment/email gateways).
    *   Page Load (LCP) < 2.5s on the Web Client.

### 9.3 Release / Master Plan Completion Criteria

The overall software release is considered "Ready for Production" only when:

*   **Test Execution:** All planned test levels (Unit, Integration, E2E, Manual) are completed.
*   **Defect Density Thresholds:**
    *   **Critical Defects:** 0 remaining. (Must be fixed immediately).
    *   **High Defects:** 0 remaining.
    *   **Medium Defects:** < 5 remaining (Must have a workaround documented).
    *   **Low/Cosmetic Defects:** < 10 remaining (Scheduled for next sprint).
*   **Documentation:** All test logs (`build_log.txt`) and defect reports are archived.
*   **Sign-Off:** Formal approval received from the QA Lead and Project Manager.

### 9.4 Failure Definitions

*   **Defect:** A deviation from the requirements (e.g., incorrect calculation, UI misalignment).
*   **Failure:** The inability of the system to perform a required function within specified limits (e.g., System Crash, Data Loss, Service Unavailability).
*   **Suspension Criteria:** Testing will be suspended if a **Blocker** defect (e.g., Application fails to launch, Login impossible) is discovered. Testing resumes only after the blocker is resolved and a new build is deployed.

---

## 10. SUSPENSION CRITERIA AND RESUMPTION REQUIREMENTS

This section defines the specific conditions under which testing activities must be halted (suspended) and the criteria that must be met to resume testing. This prevents the waste of resources on a build that is fundamentally unstable or blocked.

### 10.1 Suspension Criteria

Testing activities for the Movie Hub platform will be suspended immediately if any of the following conditions occur:

1.  **Blocker Defects (Severity 1):**
    *   The application cannot be built or deployed successfully to the test environment (e.g., Docker container crash on startup).
    *   Critical functionality is broken, preventing access to the system (e.g., "User Login" fails entirely, API Gateway returns 500 errors for all requests).
    *   Database connectivity issues prevent data persistence or retrieval (e.g., Prisma schema mismatch errors).

2.  **Test Environment Instability:**
    *   The test environment (Local Docker or Azure Staging) is unstable, effectively preventing reliable test execution (e.g., continuous network timeouts, service restarting loops).

3.  **Excessive Failure Rate:**
    *   More than **30%** of the automated Unit or Integration tests fail in a single build.
    *   A major feature (e.g., Booking Flow) exhibits blocking defects in the first 2 steps of the test case, rendering the remaining steps untestable.

### 10.2 Resumption Requirements

Testing will resume only when the following criteria are met:

1.  **Defect Resolution:**
    *   All identified "Blocker" defects have been fixed by the development team.
    *   A hotfix or new build has been successfully deployed to the test environment.

2.  **Smoke Test Pass:**
    *   A "Smoke Test" (a subset of critical tests: Build, Deploy, Login, Simple Navigation) passes with 100% success.
    *   The CI pipeline reports a successful build status.

3.  **Environment Stability:**
    *   The test environment is confirmed to be stable and accessible for a minimum of 1 hour without interruption.

4.  **Resumption Procedure:**
    *   When testing resumes, the **entire** test suite (or the specific impacted module) must be re-run from the beginning to ensure the fix did not introduce regressions (Ghost Errors). Validation starts with the previously failed test case.

---

## 11. TEST DELIVERABLES

The following artifacts will be produced and delivered throughout the testing lifecycle of the Movie Hub platform. These documents provide visibility into the testing process, results, and overall quality of the software.

### 11.1 Planning & Design Documents
*   **Master Test Plan (This Document):** The governing strategy and scope for the project.
*   **Test Case Specifications:** Detailed steps, inputs, and expected results for manual E2E tests, stored in `project_documentation_v1_1st_Dec/TestCase_Detailed.csv`.
*   **Automated Test Scripts:** The actual source code for Unit (`*.spec.ts`) and E2E (`*.cy.ts` or `*.test.ts`) tests, located within each application's directory (e.g., `apps/booking-service/src/test/`).

### 11.2 Test Execution Artifacts
*   **Test Execution Logs:**
    *   **CI Build Logs:** Automatically generated logs from GitHub Actions (`build_log.txt`), detailing the pass/fail status of every automated test.
    *   **Coverage Reports:** `lcov` or HTML reports generated by Jest (located in `coverage/`), visualizing code coverage metrics.
*   **Defect Reports:** Formal issue tickets created in the project's issue tracker (GitHub Issues), containing steps to reproduce, severity, and screenshots/logs.

### 11.3 Tools & Configuration
*   **Test Data Sets:** The synthetic data generation scripts (`synthetic_seed_data/`) and SQL seed files used to populate the test database.
*   **Configuration Files:** The specific `jest.config.ts` and `docker-compose.yml` configurations used to replicate the test environment.

### 11.4 Final Reports
*   **Test Summary Report:** A final report summarizing the testing effort at the end of the release cycle, including:
    *   Summary of tests executed vs. planned.
    *   Total defects found (by severity and status).
    *   Assessment of software quality and release readiness.
    *   Recommendations for future improvements.

---

## 12. REMAINING TEST TASKS

This section outlines testing activities that are deferred to future phases or are currently excluded from the scope of this Master Test Plan (v1.0). Identifying these tasks ensures that stakeholders understand the boundaries of the current testing effort.

### 12.1 Deferred Functional Testing
The following features are scheduled for development in future releases (v1.1 or v2.0) and are therefore not covered by this test plan:
*   **Localization (I18n):** Testing of the interface in languages other than English.
*   **Mobile Native Apps:** Testing of iOS and Android specific application builds (only Mobile Web is currently tested).
*   **Advanced Analytics Dashboard:** Deep data visualization testing for the Admin module (basic reporting is covered, but advanced predictive analytics are out of scope).

### 12.2 Non-Functional Testing Tasks
*   **Load & Performance Testing:** Large-scale load testing (simulating > 1,000 concurrent users) to verify system stability under peak traffic is deferred until the Production Infrastructure is fully provisioned.
*   **Security Penetration Testing:** Formal external security audits and penetration testing will be conducted as a separate engagement prior to the public Go-Live.
*   **Accessibility (a11y) Audits:** Full WCAG 2.1 compliance testing is deferred to the UI Polish phase.

### 12.3 Third-Party Integrations
*   **Live Payment Gateway Verification:** Final verification with real credit cards and live banking endpoints will be performed by the Operations team during the "Soft Launch" phase, distinct from this QA cycle.

### 12.4 Maintenance Tasks
*   **Test Data Refresh:** The procedure for regularly updating and sanitizing test data from production back to staging is a remaining task to be defined in the Operations Manual.

---

## 13. ENVIRONMENTAL NEEDS

This section details the hardware, software, and data requirements necessary to execute the tests defined in this plan. The Movie Hub platform relies on a containerized microservices architecture, minimizing physical hardware dependencies but requiring specific software configurations.

### 13.1 Hardware Requirements
*   **Local Development/Test Machine:**
    *   **Processor:** Modern Multi-core CPU (Intel i7/AMD Ryzen 7 or equivalent) to handle multiple Docker containers.
    *   **RAM:** Minimum 16GB (32GB recommended) to run the full stack (5 microservices + Frontend + DBs) simultaneously.
    *   **Storage:** SSD with at least 20GB free space for Docker images and database volumes.
*   **CI/CD Build Server:**
    *   GitHub Actions Runners (Standard Linux VM) provided by the repository host.

### 13.2 Software & Tools
The test environment strictly requires the following software versions:
*   **Operating System:** Windows 10/11 (with WSL2), macOS, or Linux.
*   **Runtime:** Node.js `v20.x` (LTS).
*   **Package Manager:** `npm` `v10.x` or later.
*   **Containerization:** Docker Desktop `v4.x` (or Docker Engine `v24.x` + Docker Compose `v2.x`).
*   **Build System:** Nx `v19.x` (as defined in `package.json`).
*   **Browser:** Google Chrome (Latest), Mozilla Firefox (Latest) for E2E testing.

### 13.3 Test Data Requirements
*   **Synthetic Data:** Test data is generated programmatically using the scripts located in `synthetic_seed_data/` and `apps/booking-service/src/test/fixtures/`.
*   **Database Seeding:**
    *   **Static Data:** (Genres, Cinema Layouts) - Seeded via `prisma db seed`.
    *   **Dynamic Data:** (Users, Movies, Bookings) - Generated on-the-fly for each test run to ensure isolation.
*   **Data Reset:** The database (`PostgreSQL`) and cache (`Redis`) must be capable of being reset/truncated between test suites to prevent state pollution.

### 13.4 Environment Access & Restrictions
*   **Network:** Access to external services (Clerk API) is required during Integration tests.
*   **Isolation:** The "Staging" environment on Azure is restricted to QA personnel only during the formal User Acceptance Testing (UAT) phase to prevent interference from ongoing development.
*   **Mocking:** For Unit tests, all external dependencies (Payment Gateways, Email Service) must be mocked using `jest.mock()` to avoid incurring costs or sending spam.

---

## 14. STAFFING AND TRAINING NEEDS

This section identifies the personnel required to execute the test plan and the training necessary to ensure they are effective. Given the technical nature of the Movie Hub project (Microservices, Nx, TypeScript), specific technical competencies are required.

### 14.1 Roles and Responsibilities

| Role | Responsibility | Staff Count |
| :--- | :--- | :--- |
| **Test Lead / QA Manager** | Overall strategy, test planning, defect triage, and release sign-off. | 1 |
| **Software Developer in Test (SDET)** | Writing and maintaining automated Unit/Integration tests (`Jest`) and E2E scripts (`Playwright`). Configuring CI pipelines. | 2 |
| **Manual QA Engineer** | Executing exploratory testing, UI/UX verification, and manual functional scenarios. Validating fixes in Staging. | 1 |
| **DevOps Engineer** | Managing the Docker/Azure test environments and ensuring CI stability. | 1 (Shared) |

### 14.2 Training Requirements

*   **Application Knowledge Transfer:**
    *   **All Staff:** Must review the `SRS_MOVIE_PLATFORM.md` and `ARCHITECTURE.md` to understand the domain model (Users, Movies, Cinemas, Bookings).
    *   **Session:** 1-hour "System Walkthrough" led by the Lead Architect.

*   **Technical Tool Training:**
    *   **Nx Workspace:** SDETs must understand the Nx dependency graph (`nx graph`) to optimize test execution. (Reference: `nx.json`).
    *   **Prisma ORM:** Developers/SDETs must understand Prisma schema relations to write effective database integration tests.
    *   **Docker/Testcontainers:** Training on managing local container lifecycles for database testing.

*   **Process Training:**
    *   **Defect Reporting:** All testers must be trained on the standard bug report format in GitHub Issues (Severity levels, steps to reproduce).

### 14.3 Staffing Schedule
*   **Week 1:** Onboarding and Tool Setup (Local Environment, Access to Azure).
*   **Week 2-4:** Test Case Development (Automated & Manual).
*   **Week 5:** Full System Testing & Bug Fixing.
*   **Week 6:** User Acceptance Testing (UAT) Support.

---

## 15. RESPONSIBILITIES

This section defines the chain of command and specific accountabilities for the testing activities of the Movie Hub project. Clear ownership ensures that decisions are made promptly and issues are resolved efficiently.

### 15.1 Management Responsibilities
*   **Project Manager:**
    *   Overall project schedule and resource allocation.
    *   Resolution of conflicts between Development and QA timelines.
    *   Final approval of the Release Candidate based on QA recommendations.
*   **QA Lead:**
    *   Authoring and maintaining this **Master Test Plan**.
    *   Defining the **Risk Assessment** (Section 5) and **Pass/Fail Criteria** (Section 9).
    *   Selecting features for testing (Section 6) and exclusion (Section 7).
    *   Making the final "Go/No-Go" recommendation for the release.

### 15.2 Technical Responsibilities
*   **Development Lead:**
    *   Ensuring Unit Tests are written and passing before code is merged.
    *   Providing technical support to QA for complex integration scenarios.
    *   Managing the stability of the **Staging Environment** and **CI Pipeline**.
*   **QA Engineers / SDETs:**
    *   Writing and executing detailed test cases.
    *   Reporting defects with complete logs and reproduction steps.
    *   Verifying fixes and performing regression testing.

### 15.3 Support Responsibilities
*   **DevOps / Infrastructure:**
    *   Provisioning and maintaining test data and database backups.
    *   Ensuring the availability of the Azure hosting environment.
*   **Product Owner:**
    *   Clarifying ambiguous requirements.
    *   Conducting final User Acceptance Testing (UAT).

### 15.4 Decision Matrix

| Decision | Primary Decision Maker | Consulted |
| :--- | :--- | :--- |
| **Change in Test Scope** | QA Lead | Project Manager, Product Owner |
| **Defect Severity Assignment** | QA Lead | Development Lead |
| **Release "Go/No-Go"** | Project Manager | QA Lead, Product Owner |
| **Suspension of Testing** | QA Lead | Development Lead |

---

## 16. SCHEDULE

The testing schedule is tightly coupled with the development milestones defined in the Project Plan. All dates below are **relative** dependencies; testing phases begin only upon the successful completion of the preceding development deliverable.

**Risk Mitigation:** If Development deliverables slip, the Testing phase will shift by an equal number of days to ensure quality is not compromised. Reducing test time to meet the original deadline is **not authorized** without written sign-off from the Project Manager and Product Owner, acknowledging the increased risk of critical defects.

| Milestone | Activity | Start Dependency | Estimated Duration |
| :--- | :--- | :--- | :--- |
| **M1: Test Planning** | Creation and approval of Master Test Plan & Test Cases. | Project Kickoff / SRS Approval | 5 Days |
| **M2: Unit Test Dev** | Developers write Unit & Integration tests for individual microservices. | Concurrent with Feature Development | Ongoing |
| **M3: Integration Complete** | All microservices (User, Movie, Cinema, Booking) integrated in the Staging environment. | Delivery of Feature Complete Build | 3 Days |
| **M4: System Testing** | QA execution of E2E scenarios, API validation, and Regression testing. | Completion of M3 + Smoke Test Pass | 10 Days |
| **M5: UAT** | User Acceptance Testing by Product Owner/Stakeholders. | Sign-off of System Testing (M4) | 3 Days |
| **M6: Final Release** | Deployment to Production. | UAT Approval | 1 Day |

### Critical Path Dependencies
*   **System Testing (M4)** cannot begin until the **API Gateway** and **Database Seeding Scripts** are fully functional.
*   **UAT (M5)** requires a stable Staging Environment that mirrors Production configuration.

### Handling Schedule Slippage
*   **Minor Slip (< 3 days):** Testing schedule absorbs the delay by utilizing buffer time or prioritizing "High Risk" features (Section 6) over "Low Risk" ones.
*   **Major Slip (> 3 days):** The Project Manager must either:
    1.  Extend the Go-Live date.
    2.  De-scope specific features (move to Section 7 "Features Not To Be Tested") to maintain the release date.

### Reporting
Status reports will be generated weekly, tracking "Planned vs. Actual" progress on test case execution. Any deviation > 10% triggers a risk review meeting.

---

## 17. PLANNING RISKS AND CONTINGENCIES

This section identifies strategic risks that could impact the successful execution of this Master Test Plan and outlines pre-approved contingency actions. These are distinct from software risks (Section 5) and focus on project management and resource challenges.

### 17.1 identified Risks

| Risk ID | Risk Description | Impact | Probability | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Late Delivery of Code:** Development team delivers the "Feature Complete" build later than the scheduled start of System Testing. | High. Compresses the testing window, increasing the likelihood of missed defects. | Medium | **Contingency:** (1) De-scope non-critical features (e.g., "Loyalty Points" or "Review" module). (2) Focus testing strictly on "High Risk" features (Section 6). |
| **R-02** | **Test Environment Instability:** The Staging/Docker environment fails to replicate the Production architecture correctly (e.g., networking issues between containers). | High. Blocks E2E testing and UAT. | Medium | **Contingency:** (1) Fallback to local testing on Developer machines. (2) Dedicated DevOps resource assigned to fix environment immediately. |
| **R-03** | **Third-Party Service Failure:** Clerk (Auth) or Mock Payment Gateway APIs change or become unavailable during the test window. | Medium. Blocks specific test flows. | Low | **Contingency:** Implement "Mock Mode" for all external services to allow functional testing to continue without external dependencies. |
| **R-04** | **Resource Constraints:** Unexpected absence of key QA staff (illness, turnover) during the critical execution phase. | Medium. Reduced test throughput. | Low | **Contingency:** (1) Developers assist with executing manual test cases. (2) Prioritize automated test execution over manual exploratory testing. |
| **R-05** | **Scope Creep:** New requirements are added after the Test Plan is finalized. | High. Invalidates existing test cases and requires unplanned effort. | Medium | **Contingency:** Strict Change Control. Any new feature added < 1 week before testing freeze must be moved to a "Post-Launch" release or requires a formal schedule extension. |

### 17.2 Contingency Protocols

If the **Test Schedule slips by > 20%** due to any of the above risks, the following protocol activates:

1.  **Stop:** The QA Lead halts current activities to assess the remaining workload.
2.  **Triangulate:** A meeting is called with the Project Manager and Product Owner.
3.  **Select Option:**
    *   **Option A (Time Extension):** Move the Release Date. (Preferred for Quality).
    *   **Option B (Scope Reduction):** Remove "Medium" and "Low" risk features from the test scope. They will be released "At Risk" or disabled.
    *   **Option C (Resource Surge):** Authorization for overtime (nights/weekends) for the QA team. (Least preferred due to fatigue/error rate).

**Note:** Simply "testing faster" or "skipping documentation" is **not** an acceptable contingency.

---

## 18. APPROVALS

The following signatures confirm that this Master Test Plan accurately reflects the testing strategy, scope, and quality standards for the Movie Hub project. Approval of this document authorizes the QA team to proceed with resource allocation, test case creation, and execution as defined herein.

**Note:** Approval indicates agreement with the *risks* and *contingencies* outlined in Section 17.

| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| **QA Lead / Author** | `<Name>` | ____________________ | `<Date>` |
| **Development Lead** | `<Name>` | ____________________ | `<Date>` |
| **Project Manager** | `<Name>` | ____________________ | `<Date>` |
| **Product Owner** | `<Name>` | ____________________ | `<Date>` |

### Approval History / Revision Log

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **1.0** | `2026-01-04` | `<QA Lead>` | Initial Draft creation based on IEEE 829 Standard. |
| | | | |

---

## 19. GLOSSARY

The following definitions and acronyms are used throughout this Master Test Plan. This glossary ensures a common understanding of technical, business, and testing terminology among all stakeholders.

### 19.1 Acronyms

| Acronym | Definition |
| :--- | :--- |
| **API** | Application Programming Interface. In this project, it refers to the endpoints exposed by the API Gateway and microservices. |
| **CI/CD** | Continuous Integration / Continuous Deployment. The automated pipeline (GitHub Actions) that builds, tests, and deploys the software. |
| **E2E** | End-to-End Testing. Testing the flow of an application from start to finish to ensure the system behaves as expected. |
| **JWT** | JSON Web Token. Used for securely transmitting information between the Client, Clerk, and Microservices. |
| **MTP** | Master Test Plan. This document. |
| **ORM** | Object-Relational Mapping. The technique used to convert data between the object-oriented code (TypeScript) and the relational database (PostgreSQL). We use **Prisma**. |
| **QA** | Quality Assurance. |
| **RTM** | Requirements Traceability Matrix. A document linking requirements to their corresponding test cases to ensure coverage. |
| **SDET** | Software Development Engineer in Test. A technical role responsible for writing automated test code. |
| **SRS** | Software Requirements Specification. The document describing the expected behavior of the system. |
| **UAT** | User Acceptance Testing. The final phase of testing performed by the client/product owner to verify the system meets business needs. |

### 19.2 Technical Terms

| Term | Definition |
| :--- | :--- |
| **Clerk** | The third-party service provider used for User Authentication and Management in this project. |
| **Docker** | The platform used to package the application and its dependencies into "containers" to ensure it runs the same way in all environments. |
| **Microservice** | An architectural style where the application is structured as a collection of loosely coupled services (e.g., Movie Service, Booking Service). |
| **Nx** | The build system and monorepo management tool used to orchestrate the development and testing of the project's multiple applications. |
| **Prisma** | The database tool used to define the data schema and interact with the PostgreSQL database. |
| **Redis** | An in-memory data structure store used in this project for high-speed caching and **Real-time Seat Locking**. |

### 19.3 Testing Terminology

| Term | Definition |
| :--- | :--- |
| **Blocker** | A defect of such severity that it prevents the execution of further tests. |
| **Defect** | A flaw or imperfection in the system that causes it to deviate from the requirements (commonly called a "bug"). |
| **Regression Testing** | Re-running functional and non-functional tests to ensure that previously developed and tested software still performs after a change. |
| **Smoke Test** | A preliminary test of major functions (e.g., "Does the server start?", "Can I log in?") to determine if the build is stable enough for further testing. |
| **Staging Environment** | A testing environment that is an exact replica of the production environment, used for final verification. |
| **Test Case** | A set of conditions or variables under which a tester will determine whether a system under test satisfies requirements. |
