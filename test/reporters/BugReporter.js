const fs = require('fs');
const path = require('path');

class BugReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const failedTests = [];
    let bugIdCounter = 1;

    // Iterate through all test suites
    results.testResults.forEach((testResult) => {
      // Iterate through all tests in the suite
      testResult.testResults.forEach((assertionResult) => {
        if (assertionResult.status === 'failed') {
          // Attempt to extract Test Case ID from title (e.g., "TC-2.7.1-15: ...")
          const titleParts = assertionResult.title.split(':');
          const testCaseId = titleParts.length > 1 ? titleParts[0].trim() : 'UNKNOWN';

          failedTests.push({
            id: `BUG-${String(bugIdCounter++).padStart(3, '0')}`,
            testCaseId: testCaseId,
            name: assertionResult.title,
            file: testResult.testFilePath,
            error: assertionResult.failureMessages.join('\n').trim(),
            severity: 'Critical (S1)', // Default as per template
            priority: 'High (P1)', // Default
            status: 'Open',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'),
            assignedTo: 'Developer-TEAM1016',
          });
        }
      });
    });

    if (failedTests.length > 0) {
      const report = this.generateReport(failedTests, results);
      const outputPath = path.join(process.cwd(), 'test', 'BUG_REPORT_GENERATED.txt');
      fs.writeFileSync(outputPath, report);
      console.log(`\n[BugReporter] Bug report generated at ${outputPath}`);
    } else {
        console.log('\n[BugReporter] No failed tests. No bug report generated.');
    }
  }

  generateReport(failedTests, results) {
    const now = new Date();
    // Format: 2025-12-29T15:09:11.761Z
    const timestamp = now.toISOString();

    let output = `==================================================
BUG REPORTS
Project: @movie-hub/source
Reported by: Automated Jest Reporter
Generated: ${timestamp}
Total Defects: ${failedTests.length}
==================================================

QUICK REFERENCE TABLE:
--------------------------------------------------------------------------------
Defect ID  | Test Case ID     | Status | Severity
--------------------------------------------------------------------------------
`;

    failedTests.forEach(bug => {
      output += `${bug.id.padEnd(11)}| ${bug.testCaseId.padEnd(17)}| ${bug.status.padEnd(7)}| ${bug.severity}\n`;
    });

    output += `--------------------------------------------------------------------------------

`;

    failedTests.forEach(bug => {
      // Clean up error message for summary (first line only)
      const summary = bug.error.split('\n')[0];
      const relativePath = path.relative(process.cwd(), bug.file).replace(/\\/g, '/');

      output += `--------------------------------------------------
§  Bug Name: ${bug.name}
Bug ID: ${bug.id}
§  Test Case ID: ${bug.testCaseId}
§  Date: ${bug.date}
§  Assigned to: ${bug.assignedTo}
§  Status: ${bug.status}
§  Summary/Description:
    ${summary}
§  Environments (OS/Browser): ${process.platform} / Node ${process.version}
§  Step to reproduce:
    1. Run test file: ${relativePath}
    2. Test case failed: "${bug.name}"
§  Actual results:
    Test failed with error:
    ${bug.error}
§  Expected results:
    Test assertion should pass (Expected value should match received value).
§  Severity: ${bug.severity}
Priority: ${bug.priority}
§  Attachment:
    - See TEST_RESULTS_OUTPUT.csv for evidence
    - See DEFECT_REGISTRY.csv for RTM mapping
    - See coverage/ folder for technical logs
--------------------------------------------------

`;
    });

    return output;
  }
}

module.exports = BugReporter;
