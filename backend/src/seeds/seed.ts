import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { seedLeaves } from '../leaves/seed';
import { seedPayrollConfiguration } from '../payroll-configuration/seed';
import { seedTimeManagement } from '../time-management/seed';
import { seedPayrollExecution } from '../payroll-execution/seed';
import { seedRecruitment } from '../recruitment/seed';
import { seedPayrollTracking } from '../payroll-tracking/seed';

const loadEnvFile = (envPath: string) => {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key]) return;
    process.env[key] = value;
  });
};

const resolveMongoUri = () => {
  const cwdEnv = path.join(process.cwd(), '.env');
  loadEnvFile(cwdEnv);
  return process.env.MONGO_URI || process.env.MONGODB_URI || '';
};

const run = async () => {
  const mongoUri = resolveMongoUri();
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment or .env file.');
  }

  await mongoose.connect(mongoUri);
  const connection = mongoose.connection;

  try {
    await seedTimeManagement(connection);
    await seedPayrollConfiguration(connection, {});
    await seedRecruitment(connection);
    await seedPayrollExecution(connection);
    await seedPayrollTracking(connection);
    await seedLeaves(connection, {});

  } finally {
    await connection.close();
  }
};

run().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});
