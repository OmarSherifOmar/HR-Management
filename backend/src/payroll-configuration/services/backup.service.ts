import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async createBackup(adminName: string = 'Unkn'): Promise<{ dir: string; files: string[] }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirName = `${timestamp}_${adminName.replace(/\s+/g, '_')}`;
    const backupDir = path.resolve(process.cwd(), 'backups', backupDirName);
    await fs.promises.mkdir(backupDir, { recursive: true });

    // Get list of collections
    const db = this.connection.db;
    if (!db) {
      throw new Error('No database connection available');
    }
    const collections = await db.listCollections().toArray();

    const files: string[] = [];
    for (const col of collections) {
      try {
        const name = col.name;
        this.logger.log(`Backing up collection: ${name}`);
        const cursor = db.collection(name).find();

        const outPath = path.join(backupDir, `${name}.json.gz`);
        const gzip = createGzip();
        const writeStream = fs.createWriteStream(outPath);

        // stream JSON array manually to avoid loading everything into memory
        const readable = this.cursorToJsonStream(cursor);

        await pipeline(readable, gzip, writeStream);
        files.push(outPath);
      } catch (err) {
        this.logger.error(`Failed to backup collection ${col.name}: ${err}`);
      }
    }

    return { dir: backupDir, files };
  }

  async listBackups(): Promise<string[]> {
    const base = path.resolve(process.cwd(), 'backups');
    try {
      const entries = await fs.promises.readdir(base, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name).sort().reverse();
    } catch (err) {
      return [];
    }
  }

  private async *cursorToJsonStream(cursor: any) {
    // yield a stream of Buffer/strings representing a JSON array
    let started = false;
    yield Buffer.from('[');
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const str = JSON.stringify(doc);
      if (started) yield Buffer.from(',');
      yield Buffer.from(str);
      started = true;
    }
    yield Buffer.from(']');
  }
}
