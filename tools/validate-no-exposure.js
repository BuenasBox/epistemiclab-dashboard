#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXPOSE_PATTERNS = [
  /window\.PREGUNTAS_BANK\s*=/,
  /window\.ADAPTIVE_BANK/,
  /window\.OPEN_RESPONSE_LAB_PAYLOAD/,
  /window\.SAT_WINES/,
  /const.*PREGUNTAS.*=.*\[.*\{/,
  /window\.[A-Z_]+.*items.*:/,
  /"correct_answer":/,
  /"correct_index":/,
  /"correct_letter":/,
];

const SAFE_PATTERNS = [
  { regex: /preguntas_data\.js/, desc: 'Source file (should be excluded from build)' },
  { regex: /lab_payload\.js/, desc: 'Source file (should be excluded from build)' },
  { regex: /session_bank\.js/, desc: 'Source file (should be excluded from build)' },
];

function validateNoExposure() {
  console.log('🔐 Validating that banks are NOT exposed in production build...\n');

  let violations = 0;

  // Check built/deployed files
  const checkPaths = [
    '/c/Dev/epistemiclab-dashboard/.next',
    '/c/Dev/epistemiclab-dashboard/dist',
    '/c/Dev/epistemiclab-dashboard/build',
  ];

  for (const checkPath of checkPaths) {
    if (!fs.existsSync(checkPath)) {
      console.log(`⚠️  Build directory not found: ${checkPath}`);
      continue;
    }

    console.log(`Checking: ${checkPath}`);

    try {
      const files = execSync(`find "${checkPath}" -type f \\( -name "*.js" -o -name "*.json" \\) 2>/dev/null`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim().split('\n').filter(Boolean);

      for (const file of files) {
        if (!fs.existsSync(file)) continue;

        const content = fs.readFileSync(file, 'utf8');

        for (const pattern of EXPOSE_PATTERNS) {
          if (pattern.test(content)) {
            const match = content.match(pattern);
            console.log(`  ❌ EXPOSURE: ${file}`);
            console.log(`     Pattern: ${pattern}`);
            console.log(`     Match: ${match[0].substring(0, 50)}...`);
            violations++;
          }
        }
      }
    } catch (e) {
      console.log(`⚠️  Error scanning ${checkPath}: ${e.message}`);
    }
  }

  // Check source files are in .gitignore
  const gitignorePath = '/c/Dev/epistemiclab-dashboard/.gitignore';
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const critical = [
      'preguntas_data.js',
      'lab_payload.js',
      'session_bank.js',
      'sat-wine-data.js',
    ];

    console.log('\n📋 Checking .gitignore for critical source files:');
    for (const file of critical) {
      if (gitignore.includes(file)) {
        console.log(`  ✅ ${file} is gitignored`);
      } else {
        console.log(`  ❌ ${file} is NOT gitignored - RISK!`);
        violations++;
      }
    }
  }

  // Check for string patterns in code
  console.log('\n🔍 Checking for hardcoded answers/keys in source:');
  const sourcePath = '/c/Dev/epistemiclab-dashboard/diagnostic-sba';

  if (fs.existsSync(sourcePath)) {
    const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(sourcePath, file), 'utf8');

      // Count answer exposure
      const answerMatches = content.match(/"correct_index":/g) || [];
      if (answerMatches.length > 0) {
        console.log(`  ❌ ${file}: ${answerMatches.length} exposed answer indexes`);
        violations++;
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  if (violations === 0) {
    console.log('✅ PASS: No exposures detected');
    return 0;
  } else {
    console.log(`❌ FAIL: ${violations} exposure violations found`);
    return 1;
  }
}

process.exit(validateNoExposure());
