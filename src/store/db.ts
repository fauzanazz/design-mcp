import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let _db: Database | null = null;

function openDb(): Database {
  const path = process.env.DESIGN_MCP_DB_PATH ?? "./data/design-mcp.db";
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const database = new Database(path);
  database.run(`
    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      parent_run_id TEXT NULL,
      prompt TEXT NOT NULL,
      repo_context TEXT NOT NULL,
      viewport TEXT NOT NULL,
      mode TEXT NOT NULL,
      url TEXT NULL,
      html TEXT NULL,
      summary TEXT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_runs_parent ON runs(parent_run_id)`);
  database.run(`
    CREATE TABLE IF NOT EXISTS style_directions (
      id TEXT PRIMARY KEY,
      source_run_id TEXT NULL,
      quality TEXT NOT NULL CHECK (quality IN ('amazing', 'slop')),
      aesthetic TEXT NOT NULL,
      title TEXT NOT NULL,
      signals TEXT NOT NULL,
      guidance TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  ensureStyleDirectionColumns(database);
  database.run(`CREATE INDEX IF NOT EXISTS idx_style_directions_quality_aesthetic ON style_directions(quality, aesthetic)`);
  seedStyleDirections(database);
  return database;
}

function ensureStyleDirectionColumns(database: Database): void {
  const columns = database.query<{ name: string }, []>("PRAGMA table_info(style_directions)").all();
  if (!columns.some((column) => column.name === "source_run_id")) {
    database.run("ALTER TABLE style_directions ADD COLUMN source_run_id TEXT NULL");
  }
}

function seedStyleDirections(database: Database): void {
  const existing = database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM style_directions").get();
  if ((existing?.count ?? 0) > 0) return;

  const createdAt = Date.now();
  const rows = [
    ["amazing", "editorial / magazine", "Newsstand authority", "oversized serif headline, strict columns, rules, captions, pull quotes", "Use print hierarchy: one dominant headline, modular columns, sharp rules, factual captions, restrained spot color.", 5],
    ["amazing", "luxury / refined", "Quiet atelier", "deep whitespace, serif display, hairline borders, jewel accent, tactile paper", "Make it feel expensive through restraint: fewer elements, exquisite type scale, micro-rules, and one confident accent.", 5],
    ["amazing", "brutalist / raw", "Functional poster", "visible grid, square borders, hazard accent, monospace metadata, exposed structure", "Embrace raw utility: black rules, asymmetric grid, blunt labels, and one aggressive color hit.", 4],
    ["amazing", "industrial / utilitarian", "Machine interface", "condensed type, measurement marks, data slabs, stencil labels, signal color", "Use technical density: schematics, coordinates, tabular rhythm, hazard-strip accents, and hard contrast.", 4],
    ["amazing", "soft / pastel", "Paper toy", "warm palette, rounded cutouts, friendly type, tactile shadows, simple delight", "Keep it tactile and optimistic with paper-cut shapes, soft but visible borders, and playful scale contrast.", 4],
    ["amazing", "japanese minimalism (ma / negative space)", "Ma landing", "large emptiness, asymmetric rule, single brush accent, quiet serif/sans", "Let silence do the work: sparse content, one intentional accent, uneven balance, and generous margins.", 5],
    ["amazing", "art deco / geometric", "Modern marquee", "symmetry, brass lines, fan motifs, condensed display, deep teal", "Build a ceremonial frame: symmetrical composition, geometric ornaments, stepped borders, and precise display type.", 4],
    ["amazing", "retro-futuristic", "CRT control room", "scanlines, terminal chrome, perspective grid, neon but hard-edged", "Use retro computing cues with discipline: terminal panels, pixel borders, scanlines, and hard shadows instead of glow blobs.", 4],
    ["slop", "all", "AI SaaS blob stack", "dark navy/black, purple-cyan gradients, blurred radial blobs, glass cards, Inter", "Avoid the default AI/SaaS look. Replace soft glow blobs and glass cards with direction-specific structure and ornament.", 10],
    ["slop", "all", "Generic startup hero", "centered h1, vague subtitle, rounded CTA, three floating cards, no context", "Avoid cookie-cutter hero composition. Add contextual artifacts, asymmetry, editorial hierarchy, or product-specific details.", 8],
    ["slop", "all", "Tailwind default palette", "slate/zinc background, blue/violet accents, uniform 12px radius, soft shadows", "Avoid unchanged utility defaults. Commit to a distinctive palette family, border language, and radius system.", 8],
    ["slop", "all", "Over-animated garnish", "many tiny unrelated animations, loops everywhere, parallax without purpose", "Avoid motion as decoration. Use one coherent sequence tied to layout hierarchy and a few meaningful interactions.", 6],
  ] as const;

  const insert = database.prepare(`
    INSERT INTO style_directions (id, source_run_id, quality, aesthetic, title, signals, guidance, weight, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = database.transaction(() => {
    rows.forEach((row, index) => {
      insert.run(`seed-${index + 1}`, null, row[0], row[1], row[2], row[3], row[4], row[5], createdAt);
    });
  });
  transaction();
}

// Lazy singleton — reads DESIGN_MCP_DB_PATH on first access so tests can set it before first use
export function getDb(): Database {
  if (!_db) {
    _db = openDb();
  }
  return _db;
}

// Allow tests to reset the singleton (e.g. between test files that set different DB paths)
export function resetDb(): void {
  _db?.close();
  _db = null;
}
