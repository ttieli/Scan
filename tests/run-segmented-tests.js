#!/usr/bin/env node

/**
 * Segmented Test Execution Script
 * 
 * Runs the incremental testing strategy with proper phase management.
 * Usage: node tests/run-segmented-tests.js [phase] [options]
 */

const IncrementalTestRunner = require('./core/incremental-test-runner');
const TestBoundaries = require('./core/test-boundaries');
const chalk = require('chalk'); // Optional: install chalk for colored output

// Parse command line arguments
const args = process.argv.slice(2);
const phase = args[0] || 'phase1';
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  stopOnFailure: !args.includes('--continue'),
  report: args.includes('--report'),
  dryRun: args.includes('--dry-run')
};

console.log('='.repeat(60));
console.log('QR DATA TRANSFER - SEGMENTED TEST EXECUTION');
console.log('='.repeat(60));
console.log(`Starting Phase: ${phase}`);
console.log(`Options: ${JSON.stringify(options)}`);
console.log('='.repeat(60));

// Display test strategy
if (options.verbose) {
  const strategy = TestBoundaries.createProgressiveIntegration();
  console.log('\nTest Strategy Overview:');
  Object.entries(strategy).forEach(([key, phase]) => {
    if (key !== 'complete') {
      console.log(`\n${key.toUpperCase()}: ${phase.name}`);
      console.log(`  Duration: ${phase.duration}`);
      console.log(`  Goals:`);
      phase.goals.forEach(goal => console.log(`    - ${goal}`));
      console.log(`  Success Criteria:`);
      console.log(`    - Coverage: ${phase.criteria.coverage}%`);
      console.log(`    - Passing: ${phase.criteria.passing}%`);
      console.log(`    - Performance: <${phase.criteria.performance}ms per test`);
    }
  });
  console.log('\n' + '='.repeat(60));
}

// Dry run mode - just show what would be executed
if (options.dryRun) {
  console.log('\n[DRY RUN MODE] - No tests will be executed\n');
  
  const runner = new IncrementalTestRunner();
  const phases = ['phase1', 'phase2', 'phase3', 'phase4'];
  
  phases.forEach(p => {
    const tests = runner.getPhaseTests(p);
    console.log(`\n${p.toUpperCase()}: ${tests.length} tests`);
    tests.forEach(test => {
      console.log(`  - ${test.name} (${test.id})`);
    });
  });
  
  console.log('\n[DRY RUN COMPLETE]');
  process.exit(0);
}

// Create and run the test runner
const runner = new IncrementalTestRunner();

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\nTest execution interrupted by user');
  process.exit(1);
});

// Execute tests
runner.runIncrementalTests({
  startPhase: phase,
  verbose: options.verbose,
  stopOnFailure: options.stopOnFailure,
  maxRetries: 3
}).then(report => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST EXECUTION COMPLETE');
  console.log('='.repeat(60));
  
  // Display summary
  console.log('\nSummary:');
  console.log(`  Total Tests: ${report.summary.totalTests}`);
  console.log(`  Passed: ${report.summary.totalPassed}`);
  console.log(`  Failed: ${report.summary.totalFailed}`);
  console.log(`  Skipped: ${report.summary.totalSkipped}`);
  console.log(`  Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
  
  // Display phase results
  console.log('\nPhase Results:');
  Object.entries(report.phases).forEach(([phase, results]) => {
    const status = results.success ? '✓' : '✗';
    console.log(`  ${status} ${phase}: ${results.passed}/${results.total} passed (${results.duration}ms)`);
    
    if (results.failures.length > 0 && options.verbose) {
      console.log(`    Failures:`);
      results.failures.forEach(failure => {
        console.log(`      - ${failure.test}: ${failure.error}`);
      });
    }
  });
  
  // Display recommendations
  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  // Save report if requested
  if (options.report) {
    const fs = require('fs');
    const reportPath = `test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }
  
  // Exit with appropriate code
  process.exit(report.summary.totalFailed > 0 ? 1 : 0);
}).catch(error => {
  console.error('\n' + '='.repeat(60));
  console.error('TEST EXECUTION FAILED');
  console.error('='.repeat(60));
  console.error('\nError:', error.message);
  
  if (options.verbose) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  
  process.exit(1);
});

// Helper to display progress
if (options.verbose) {
  setInterval(() => {
    process.stdout.write('.');
  }, 1000);
}