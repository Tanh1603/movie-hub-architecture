pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'
    }
    
    environment {
        NODE_ENV = 'test'
        CI = 'true'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm ci'
            }
        }
        
        stage('Clean Previous Results') {
            steps {
                echo 'Cleaning previous test results...'
                bat 'npm run test:clean'
            }
        }
        
        stage('Unit Tests') {
            steps {
                echo 'Running Unit Tests...'
                script {
                    try {
                        bat 'npm run test:unit:report'
                    } catch (Exception e) {
                        currentBuild.result = 'UNSTABLE'
                        echo "Unit tests failed: ${e.getMessage()}"
                    }
                }
            }
            post {
                always {
                    echo 'Publishing Unit Test Results...'
                    // Publish JUnit test results
                    publishTestResults testResultsPattern: 'test-results/junit/junit.xml'
                    
                    // Publish coverage reports
                    publishCoverageResults(
                        adapters: [
                            coberturaAdapter('test-results/coverage/cobertura-coverage.xml')
                        ],
                        sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
                    )
                    
                    // Archive unit test artifacts
                    archiveArtifacts artifacts: 'test-results/coverage/lcov-report/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'test-results/junit/*.xml', fingerprint: true
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                echo 'Running Integration Tests...'
                script {
                    try {
                        bat 'npm run test:integration:report'
                    } catch (Exception e) {
                        currentBuild.result = 'UNSTABLE'
                        echo "Integration tests failed: ${e.getMessage()}"
                    }
                }
            }
            post {
                always {
                    echo 'Publishing Integration Test Results...'
                    // Publish integration test results
                    publishTestResults testResultsPattern: 'apps/**/test-results/junit/junit.xml'
                    
                    // Archive integration test artifacts
                    archiveArtifacts artifacts: 'apps/**/test-results/coverage/**/*', fingerprint: true
                }
            }
        }
        
        stage('Generate Test Report') {
            steps {
                echo 'Generating comprehensive test report...'
                script {
                    bat '''
                        echo "=== MOVIE HUB TEST EXECUTION SUMMARY ===" > test-results/test-summary.txt
                        echo "Build Number: %BUILD_NUMBER%" >> test-results/test-summary.txt
                        echo "Build Date: %BUILD_TIMESTAMP%" >> test-results/test-summary.txt
                        echo "Git Commit: %GIT_COMMIT%" >> test-results/test-summary.txt
                        echo "" >> test-results/test-summary.txt
                        echo "Unit Tests: COMPLETED" >> test-results/test-summary.txt
                        echo "Integration Tests: COMPLETED" >> test-results/test-summary.txt
                        echo "Coverage Reports: GENERATED" >> test-results/test-summary.txt
                        echo "" >> test-results/test-summary.txt
                        echo "Reports Location:" >> test-results/test-summary.txt
                        echo "- Unit Test Coverage: test-results/coverage/lcov-report/index.html" >> test-results/test-summary.txt
                        echo "- JUnit Reports: test-results/junit/" >> test-results/test-summary.txt
                        echo "- Integration Coverage: apps/*/test-results/coverage/" >> test-results/test-summary.txt
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/test-summary.txt', fingerprint: true
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            // Clean up node_modules if needed
            // bat 'if exist node_modules rmdir /s /q node_modules'
        }
        
        success {
            echo 'Pipeline completed successfully!'
            emailext (
                subject: "✅ Movie Hub Tests Passed - Build ${BUILD_NUMBER}",
                body: """
                All tests passed successfully!
                
                Build: ${BUILD_NUMBER}
                Branch: ${BRANCH_NAME}
                
                Test Results:
                - Unit Tests: ✅ PASSED
                - Integration Tests: ✅ PASSED
                
                View detailed reports: ${BUILD_URL}
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        
        failure {
            echo 'Pipeline failed!'
            emailext (
                subject: "❌ Movie Hub Tests Failed - Build ${BUILD_NUMBER}",
                body: """
                Tests failed!
                
                Build: ${BUILD_NUMBER}
                Branch: ${BRANCH_NAME}
                
                Check the console output: ${BUILD_URL}console
                View test reports: ${BUILD_URL}
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        
        unstable {
            echo 'Pipeline completed with test failures!'
            emailext (
                subject: "⚠️ Movie Hub Tests Unstable - Build ${BUILD_NUMBER}",
                body: """
                Some tests failed but build continued.
                
                Build: ${BUILD_NUMBER}
                Branch: ${BRANCH_NAME}
                
                Check the test reports: ${BUILD_URL}
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}