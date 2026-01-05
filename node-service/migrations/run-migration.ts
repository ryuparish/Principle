import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

/**
 * Simple migration runner for SQLite
 * Usage: ts-node migrations/run-migration.ts [database-path]
 */

const dbPath = process.argv[2] || process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const absoluteDbPath = path.resolve(dbPath);
const migrationFile = path.join(__dirname, '001_add_portal_fields.sql');

console.log(`\n🔄 Running migration on database: ${absoluteDbPath}`);

if (!fs.existsSync(absoluteDbPath)) {
  console.error(`❌ Database not found at: ${absoluteDbPath}`);
  process.exit(1);
}

try {
  const db = new Database(absoluteDbPath);
  const sql = fs.readFileSync(migrationFile, 'utf-8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`\n📝 Executing ${statements.length} migration statements...\n`);

  db.exec('BEGIN TRANSACTION');

  for (const statement of statements) {
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    console.log(`  ✓ ${preview}...`);
    db.exec(statement);
  }

  db.exec('COMMIT');

  console.log(`\n✅ Migration completed successfully!`);
  console.log(`\nAdded columns:`);
  console.log(`  - node_type (TEXT, default 'regular')`);
  console.log(`  - portal_target_map_id (TEXT, nullable)`);
  console.log(`  - portal_target_node_id (TEXT, nullable)`);
  console.log(`  - portal_source_map_id (TEXT, nullable)`);
  console.log(`  - portal_source_node_id (TEXT, nullable)\n`);

  db.close();
} catch (error: any) {
  console.error(`\n❌ Migration failed:`, error.message);

  // Check if columns already exist
  if (error.message?.includes('duplicate column')) {
    console.log(`\n⚠️  Columns already exist - migration may have been run previously.`);
    process.exit(0);
  }

  process.exit(1);
}
