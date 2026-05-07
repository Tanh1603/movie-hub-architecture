# Movie Hub Testing Guide

This guide explains how to run unit tests and integration tests with unified reporting for Jenkins CI/CD.

## Test Structure

```
test-results/
├── coverage/
│   └── apps/
│       ├── movie-service/
│       │   ├── index.html          # HTML coverage report
│       │   ├── lcov.info           # LCOV format
│       │   └── cobertura-coverage.xml # Jenkins format
│       ├── user-service/
│       └── cinema-service/
├── junit/
│   ├── movie-service-junit.xml     # JUnit results
│   ├── user-service-junit.xml
│   └── cinema-service-junit.xml
└── test-summary.txt                # Execution summary
```

## Commands

### Unit Tests

```bash
# Run all unit tests with coverage
npm run test:unit:report

# Run specific service tests
npx nx test movie-service
npx nx test user-service
npx nx test cinema-service
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration:report
```

### Cleanup

```bash
# Clean all test results
npm run test:clean
```

## Jenkins Integration

The `Jenkinsfile` in the root directory contains:

1. **Unit Tests Stage**: Runs `npm run test:unit:report`
2. **Integration Tests Stage**: Runs `npm run test:integration:report`
3. **Report Publishing**: Automatically publishes:
   - JUnit test results
   - Coverage reports (Cobertura format)
   - HTML coverage reports as artifacts

### Jenkins Setup

1. Create a new Pipeline job in Jenkins
2. Point to your repository
3. Set the branch to `testing-be-develop-1`
4. The `Jenkinsfile` will automatically handle the rest

### Jenkins Plugins Required

- **Pipeline**: For Jenkinsfile support
- **NodeJS**: For Node.js builds
- **JUnit**: For test result publishing
- **Coverage**: For coverage report publishing
- **Email Extension**: For notifications

## Test Writing

### Unit Tests (.spec.ts)

- Test individual functions/methods in isolation
- Mock external dependencies (Prisma, Cache, etc.)
- Fast execution
- Example: `src/module/movie/movie.service.spec.ts`

### Integration Tests (.e2e-spec.ts)

- Test multiple components working together
- Use real or test databases
- Test API endpoints end-to-end
- Example: `src/movie.e2e-spec.ts`

## Coverage Reports

- **HTML Reports**: Open `test-results/coverage/apps/[service]/index.html` in browser
- **Jenkins Reports**: Available in Jenkins build artifacts and coverage plugin
- **LCOV Reports**: For editor integration and CI tools

## Example Test Results

After running tests successfully:

- Unit tests: All services tested with mocked dependencies
- Coverage: Detailed line-by-line coverage reports
- JUnit XML: Ready for Jenkins test result tracking
- HTML Reports: Visual coverage reports for review

## Troubleshooting

1. **Prisma Issues**: Run `npm run prisma:generate` first
2. **Permission Errors**: Ensure proper file permissions on Windows
3. **Cache Issues**: Run `npm run test:clean` to clear old results
4. **Missing Dependencies**: Ensure all dev dependencies are installed
