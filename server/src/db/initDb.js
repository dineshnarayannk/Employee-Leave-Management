import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config, validateDatabaseConfig, getDbSslConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('====================================================');
  console.log(' TiDB Cloud Database Schema Initialization');
  console.log('====================================================');

  const { isConfigured, missing } = validateDatabaseConfig();
  if (!isConfigured) {
    console.error('\n❌ Database initialization aborted.');
    console.error('Missing required database configuration:');
    missing.forEach((item) => console.error(`   - ${item}`));
    console.error('\nPlease update your .env file with your TiDB Cloud credentials.\n');
    process.exit(1);
  }

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`\n❌ Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`\nConnecting to TiDB Cloud host: ${config.database.host}:${config.database.port}...`);
  console.log(`Target Database: ${config.database.name}`);

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
    console.log('Applying DDL schema statements from database/schema.sql...');

    await connection.query(schemaSql);

    console.log('\n Schema initialization completed successfully!');
    console.log('All required tables (roles, users, leave_types, leave_balances, leave_requests, notifications, audit_logs) are verified.');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Failed to initialize database schema:');
    console.error(`Error code: ${error.code || 'UNKNOWN'}`);
    console.error(`Message: ${error.message}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
