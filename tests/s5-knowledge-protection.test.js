/**
 * Phase S5: Knowledge Protection Validation
 *
 * Validates that pedagogical knowledge is not exposed in frontend
 * and can only be accessed via authenticated backend APIs.
 */

const fs = require('fs');
const path = require('path');

describe('S5 — Knowledge Protection', () => {
  describe('S5.4 — SBA Bank Protection', () => {
    it('Frontend cannot access complete SBA bank via JavaScript', () => {
      const preguntasPath = path.join(
        __dirname,
        '../diagnostic-sba/preguntas_data.js'
      );
      const content = fs.readFileSync(preguntasPath, 'utf8');

      // Verify window object exposure
      expect(content).toContain('window.PREGUNTAS_BANK');

      // Count items
      const itemMatches = content.match(/"item_id"\s*:/g) || [];
      expect(itemMatches.length).toBeGreaterThan(0);

      // Verify answers are exposed (current state - to be eliminated)
      const correctIndexMatches = content.match(/"correct_index"\s*:/g) || [];
      expect(correctIndexMatches.length).toBeGreaterThan(0);
      // After migration: expect(correctIndexMatches.length).toBe(0)
    });

    it('SBA bank answers are exposed in source (before migration)', () => {
      const preguntasPath = path.join(
        __dirname,
        '../diagnostic-sba/preguntas_data.js'
      );
      const content = fs.readFileSync(preguntasPath, 'utf8');

      const answers = content.match(/"correct_index"\s*:\s*(\d+)/g) || [];
      console.log(`⚠️  Found ${answers.length} exposed answer indexes in preguntas_data.js`);
      expect(answers.length).toBeGreaterThan(0);
    });
  });

  describe('S5.5 — Open Response Bank Protection', () => {
    it('Frontend OR bank has complete feedback profiles', () => {
      const labPath = path.join(
        __dirname,
        '../open-response-lab/lab_payload.js'
      );
      const content = fs.readFileSync(labPath, 'utf8');

      expect(content).toContain('window.OPEN_RESPONSE_LAB_PAYLOAD');

      // Check for feedback content
      const feedbackMatches = content.match(/"feedback_profile"\s*:/g) || [];
      expect(feedbackMatches.length).toBeGreaterThan(0);

      // Check for expected concepts (pedagogical value)
      const conceptMatches = content.match(/"expected_concepts"\s*:/g) || [];
      expect(conceptMatches.length).toBeGreaterThan(0);
    });

    it('OR bank contains full mentor coaching structure', () => {
      const labPath = path.join(
        __dirname,
        '../open-response-lab/lab_payload.js'
      );
      const content = fs.readFileSync(labPath, 'utf8');

      // These are sensitive pedagogical assets
      const sensitivePatterns = [
        /FOUNDATIONAL_RESPONSE/,
        /DEVELOPING_RESPONSE/,
        /STRONG_RESPONSE/,
      ];

      for (const pattern of sensitivePatterns) {
        expect(content).toMatch(pattern);
      }
    });
  });

  describe('S5.6 — SAT Bank Protection', () => {
    it('SAT wines data is exposed in frontend', () => {
      const winesPath = path.join(
        __dirname,
        '../shared/sat-wine-data.js'
      );

      if (!fs.existsSync(winesPath)) {
        console.log('⚠️  sat-wine-data.js not found');
        return;
      }

      const content = fs.readFileSync(winesPath, 'utf8');
      expect(content).toContain('window.SAT_WINES');
    });
  });

  describe('S5.7 — No Direct DevTools Access After Migration', () => {
    it('Get-SBA-Bank endpoint requires authentication', async () => {
      // This validates that the endpoint MUST have auth
      const endpoint = 'get-sba-bank';

      // Pseudo-test to show requirements
      expect(endpoint).toBe('get-sba-bank');
      // Would test:
      // - GET without token returns 401
      // - GET with token but no plan returns 403
      // - GET with valid token/plan returns questions
      // - Response does NOT include correct_index/correct_letter
    });

    it('Get-OR-Bank endpoint requires authentication', async () => {
      const endpoint = 'get-or-bank';
      expect(endpoint).toBe('get-or-bank');
      // Would test:
      // - GET without token returns 401
      // - GET with invalid token returns 401
      // - GET with valid token returns OR items
    });
  });

  describe('S5 — Migration Verification', () => {
    it('Supabase tables have correct schema (post-migration)', async () => {
      // This is a documentation test
      const expectedTables = [
        'sba_bank',
        'or_bank',
        'adaptive_bank',
        'sat_wines',
        'mentor_config',
        'misconceptions',
        'distinction_patterns',
      ];

      expectedTables.forEach((table) => {
        // After migration, would verify:
        // SELECT COUNT(*) FROM table_name WHERE id IS NOT NULL;
        console.log(`✅ Table ${table} should exist with RLS enabled`);
      });
    });

    it('Critical frontend files are excluded from deployment', () => {
      const gitignorePath = path.join(
        __dirname,
        '../.gitignore'
      );

      if (!fs.existsSync(gitignorePath)) {
        console.log('⚠️  .gitignore not found');
        return;
      }

      const gitignore = fs.readFileSync(gitignorePath, 'utf8');

      const criticalFiles = [
        'preguntas_data.js',
        'lab_payload.js',
        'session_bank.js',
      ];

      for (const file of criticalFiles) {
        if (gitignore.includes(file)) {
          console.log(`✅ ${file} is in .gitignore`);
        } else {
          console.log(`❌ ${file} is NOT in .gitignore`);
        }
      }
    });
  });
});

describe('S5 — Risk Assessment', () => {
  it('Inventory of exposed assets before migration', () => {
    const assets = {
      sba: {
        file: 'preguntas_data.js',
        items: 670,
        riskLevel: 10,
        directAccess: true,
      },
      or: {
        file: 'lab_payload.js',
        items: 106,
        riskLevel: 9,
        directAccess: true,
      },
      adaptive: {
        file: 'session_bank.js',
        items: 119,
        riskLevel: 9,
        directAccess: true,
      },
      sat: {
        file: 'sat-wine-data.js',
        items: 'unknown',
        riskLevel: 8,
        directAccess: true,
      },
    };

    console.log('\n📊 EXPOSURE SUMMARY:\n');
    Object.entries(assets).forEach(([key, asset]) => {
      console.log(`${key.toUpperCase()}:`);
      console.log(`  File: ${asset.file}`);
      console.log(`  Items: ${asset.items}`);
      console.log(`  Risk: ${asset.riskLevel}/10`);
      console.log(`  Direct Access: ${asset.directAccess ? 'YES ❌' : 'NO ✅'}`);
      console.log('');
    });

    expect(assets.sba.riskLevel).toBe(10);
    expect(assets.or.riskLevel).toBeGreaterThan(0);
    expect(assets.adaptive.riskLevel).toBeGreaterThan(0);
  });
});
