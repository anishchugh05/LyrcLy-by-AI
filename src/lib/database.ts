import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { SongData, RevisionData, ApiUsage } from '@/types';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const envPath = process.env.DATABASE_URL;
    const resolvedPath = dbPath || envPath || path.join(process.cwd(), 'data', 'lyricsmith.db');
    const databasePath = resolvedPath.startsWith('file:') ? resolvedPath.replace('file:', '') : resolvedPath;

    // Ensure the directory exists so SQLite can create the file
    const dir = path.dirname(databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(databasePath);
    this.initDatabase();
  }

  private initDatabase(): void {
    // Create songs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        genre TEXT NOT NULL,
        vibe TEXT NOT NULL,
        theme TEXT NOT NULL,
        lyrics_json TEXT NOT NULL,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create revisions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        song_id TEXT NOT NULL,
        revision_type TEXT NOT NULL,
        instruction TEXT NOT NULL,
        old_lyrics TEXT NOT NULL,
        new_lyrics TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    `);

    // Create usage tracking table for rate limiting
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at);
      CREATE INDEX IF NOT EXISTS idx_revisions_song_id ON revisions(song_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_ip_endpoint ON api_usage(ip_address, endpoint);
      CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
    `);
  }

  // Song operations
  async createSong(songData: Omit<SongData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO songs (id, genre, vibe, theme, lyrics_json, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      songData.genre,
      songData.vibe,
      songData.theme,
      songData.lyricsJson,
      songData.metadataJson || null,
      now,
      now
    );

    return id;
  }

  async getSong(songId: string): Promise<SongData | null> {
    const stmt = this.db.prepare('SELECT * FROM songs WHERE id = ?');
    const row = stmt.get(songId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      genre: row.genre,
      vibe: row.vibe,
      theme: row.theme,
      lyricsJson: row.lyrics_json,
      metadataJson: row.metadata_json,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async updateSong(songId: string, updates: Partial<Omit<SongData, 'id' | 'createdAt'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.genre !== undefined) {
      fields.push('genre = ?');
      values.push(updates.genre);
    }
    if (updates.vibe !== undefined) {
      fields.push('vibe = ?');
      values.push(updates.vibe);
    }
    if (updates.theme !== undefined) {
      fields.push('theme = ?');
      values.push(updates.theme);
    }
    if (updates.lyricsJson !== undefined) {
      fields.push('lyrics_json = ?');
      values.push(updates.lyricsJson);
    }
    if (updates.metadataJson !== undefined) {
      fields.push('metadata_json = ?');
      values.push(updates.metadataJson);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(songId);

    const stmt = this.db.prepare(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteSong(songId: string): Promise<void> {
    // Delete revisions first (foreign key constraint)
    const deleteRevisionsStmt = this.db.prepare('DELETE FROM revisions WHERE song_id = ?');
    deleteRevisionsStmt.run(songId);

    // Delete the song
    const deleteSongStmt = this.db.prepare('DELETE FROM songs WHERE id = ?');
    deleteSongStmt.run(songId);
  }

  // Revision operations
  async createRevision(revisionData: Omit<RevisionData, 'id' | 'createdAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO revisions (id, song_id, revision_type, instruction, old_lyrics, new_lyrics, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      revisionData.songId,
      revisionData.revisionType,
      revisionData.instruction,
      revisionData.oldLyrics,
      revisionData.newLyrics,
      now
    );

    return id;
  }

  async getSongRevisions(songId: string): Promise<RevisionData[]> {
    const stmt = this.db.prepare('SELECT * FROM revisions WHERE song_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(songId) as any[];

    return rows.map(row => ({
      id: row.id,
      songId: row.song_id,
      revisionType: row.revision_type,
      instruction: row.instruction,
      oldLyrics: row.old_lyrics,
      newLyrics: row.new_lyrics,
      createdAt: new Date(row.created_at)
    }));
  }

  async getRevision(revisionId: string): Promise<RevisionData | null> {
    const stmt = this.db.prepare('SELECT * FROM revisions WHERE id = ?');
    const row = stmt.get(revisionId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      songId: row.song_id,
      revisionType: row.revision_type,
      instruction: row.instruction,
      oldLyrics: row.old_lyrics,
      newLyrics: row.new_lyrics,
      createdAt: new Date(row.created_at)
    };
  }

  // Rate limiting operations
  async recordApiUsage(ipAddress: string, endpoint: string): Promise<void> {
    const stmt = this.db.prepare('INSERT INTO api_usage (ip_address, endpoint) VALUES (?, ?)');
    stmt.run(ipAddress, endpoint);
  }

  async checkRateLimit(ipAddress: string, endpoint: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - (windowSeconds * 1000)).toISOString();

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM api_usage
      WHERE ip_address = ? AND endpoint = ? AND timestamp > ?
    `);

    const result = stmt.get(ipAddress, endpoint, cutoffTime) as any;
    const count = result ? result.count : 0;

    return count < maxRequests;
  }

  async cleanupOldUsageRecords(maxAge: number = 3600): Promise<void> {
    const cutoffTime = new Date(Date.now() - (maxAge * 1000)).toISOString();
    const stmt = this.db.prepare('DELETE FROM api_usage WHERE timestamp < ?');
    stmt.run(cutoffTime);
  }

  // Statistics and analytics
  async getUsageStats(timeframe: number = 86400): Promise<{ [endpoint: string]: number }> {
    const cutoffTime = new Date(Date.now() - (timeframe * 1000)).toISOString();

    const stmt = this.db.prepare(`
      SELECT endpoint, COUNT(*) as count
      FROM api_usage
      WHERE timestamp > ?
      GROUP BY endpoint
    `);

    const rows = stmt.all(cutoffTime) as any[];
    const stats: { [endpoint: string]: number } = {};

    rows.forEach(row => {
      stats[row.endpoint] = row.count;
    });

    return stats;
  }

  async getTotalSongsCount(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM songs');
    const result = stmt.get() as any;
    return result ? result.count : 0;
  }

  async getTotalRevisionsCount(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM revisions');
    const result = stmt.get() as any;
    return result ? result.count : 0;
  }

  // Database maintenance
  close(): void {
    this.db.close();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const stmt = this.db.prepare('SELECT 1');
      stmt.get();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let databaseInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!databaseInstance) {
    databaseInstance = new DatabaseService();
  }
  return databaseInstance;
}
