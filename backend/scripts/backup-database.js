#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * This script creates a backup of the MongoDB database.
 * 
 * Usage:
 *   node scripts/backup-database.js
 * 
 * Environment Variables:
 *   DB_URL - MongoDB connection string
 *   BACKUP_DIR - Directory to store backups (default: ./backups)
 *   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 7)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_URL = process.env.DB_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7');

if (!DB_URL) {
  console.error('❌ DB_URL environment variable is required');
  process.exit(1);
}

// Extract database name from connection string
const dbNameMatch = DB_URL.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'liywan';

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `liywan-backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log(`📦 Creating backup: ${backupName}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Destination: ${backupPath}`);

  try {
    // Use mongodump to create backup
    const command = `mongodump --uri="${DB_URL}" --out="${backupPath}"`;
    
    console.log('   Running mongodump...');
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('writing')) {
      console.warn('   Warning:', stderr);
    }
    
    if (stdout) {
      console.log('   Output:', stdout);
    }

    // Compress backup
    console.log('   Compressing backup...');
    const tarCommand = `tar -czf "${backupPath}.tar.gz" -C "${BACKUP_DIR}" "${backupName}"`;
    await execAsync(tarCommand);
    
    // Remove uncompressed backup
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    const backupSize = fs.statSync(`${backupPath}.tar.gz`).size;
    const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupName}.tar.gz`);
    console.log(`   Size: ${backupSizeMB} MB`);
    
    return `${backupPath}.tar.gz`;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  console.log(`\n🧹 Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days...`);
  
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.startsWith('liywan-backup-') && file.endsWith('.tar.gz')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`   Deleted: ${file}`);
        }
      }
    }
    
    if (deletedCount === 0) {
      console.log('   No old backups to delete');
    } else {
      console.log(`✅ Deleted ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.warn('⚠️  Failed to cleanup old backups:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting database backup...\n');
  
  await createBackup();
  await cleanupOldBackups();
  
  console.log('\n✅ Backup process completed!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


