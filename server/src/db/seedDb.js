import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config, validateDatabaseConfig, getDbSslConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  console.log('====================================================');
  console.log(' TiDB Cloud Database Seeding');
  console.log('====================================================');

  const { isConfigured, missing } = validateDatabaseConfig();
  if (!isConfigured) {
    console.error('\n❌ Database seeding aborted.');
    console.error('Missing required database configuration:');
    missing.forEach((item) => console.error(`   - ${item}`));
    console.error('\nPlease update your .env file with your TiDB Cloud credentials.\n');
    process.exit(1);
  }

  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error(`\n❌ Seed file not found at: ${seedPath}`);
    process.exit(1);
  }

  const seedSql = fs.readFileSync(seedPath, 'utf8');

  let connection;
  try {
    const sslConfig = getDbSslConfig();
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: sslConfig,
      multipleStatements: true,
    });

    console.log(' Connected to TiDB successfully!');
    console.log('Applying seed data from database/seed.sql...');

    await connection.query(seedSql);

    console.log('\n Seed data applied successfully!');
    console.log('Roles (Admin: 1, Manager: 2, Employee: 3) & default leave types are active.');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Failed to seed database:');
    console.error(`Error code: ${error.code || 'UNKNOWN'}`);
    console.error(`Message: ${error.message}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
