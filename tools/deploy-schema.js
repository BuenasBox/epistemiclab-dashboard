#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'hylknjjhmxsuuwbsslkr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function deploySchema() {
  try {
    console.log('🚀 Connecting to Supabase PostgreSQL...');
    console.log('  Host: hylknjjhmxsuuwbsslkr.supabase.co:5432');
    console.log('  User: postgres');
    
    await client.connect();
    console.log('✅ Connected');

    const schemaPath = path.join(__dirname, '../migrations/0001_pedagogical_knowledge.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Deploying schema...');
    const statements = sql.split(';').filter(s => s.trim());
    
    let created = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        await client.query(stmt);
        created++;
        if (i % 5 === 0) process.stdout.write('.');
      } catch (e) {
        if (e.message.includes('already exists')) {
          created++;
        } else {
          console.error(`\n❌ Statement ${i+1} failed:`, e.message.substring(0, 100));
        }
      }
    }

    console.log(`\n✅ Schema deployed (${created} statements)`);
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables:');
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploySchema();
