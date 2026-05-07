Cinema Location Unit Tests - Complete ✅
I've successfully created comprehensive unit tests for the cinema-location controller and service as requested. Here's what was delivered:

Test Coverage Summary
96 tests total - All passing ✅
Service tests: 50+ tests covering all methods and edge cases
Controller tests: 45+ tests covering all MessagePattern endpoints
CinemaLocationService Tests
The service tests cover:

getCinemasNearby: Location-based searches with radius filtering, pagination, distance sorting
getCinemasWithFilters: Advanced filtering by city, district, operating hours, with search queries
getCinemaDetail: Single cinema retrieval with distance calculations
searchCinemas: Text-based cinema search with pagination
getAvailableCities: Location metadata retrieval
getAvailableDistricts: District filtering by city
CinemaLocationController Tests
The controller tests cover:

All 6 MessagePattern decorated methods
Input validation and DTO handling
Service integration and error propagation
Async operation handling
Edge cases and error scenarios
Key Features Tested
Geographic calculations: Haversine distance formulas and bounding box queries
Complex filtering: Multiple criteria combinations (city, district, operating hours)
Pagination: Proper limit/offset handling and metadata
Sorting: Distance-based and alphabetical ordering
Error handling: Validation errors, service failures, and async operation failures
Mocking: Comprehensive mocking of Prisma operations, mappers, and utilities
Technical Quality
TypeScript compliant: Fixed all lint errors with proper type assertions
Jest best practices: Proper setup/teardown, isolated tests, comprehensive mocking
Real-world scenarios: Tests simulate actual usage patterns and edge cases
Geographic accuracy: Tests verify coordinate handling and distance calculations
The tests ensure the location-based cinema services work correctly for finding nearby cinemas, filtering by various criteria, and providing accurate geographic data to users.