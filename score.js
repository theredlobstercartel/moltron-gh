#!/usr/bin/env node

import { DatabaseSync } from 'node:sqlite';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getLatestVersion() {
  try {
    const version = execSync('git describe --tags --abbrev=0', {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    
    if (version) {
      return version;
    }
  } catch (error) {
    // Git command failed, try package.json
  }

  try {
    const packageJsonPath = join(__dirname, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.version) {
        return `v${packageJson.version}`;
      }
    }
  } catch (error) {
    // package.json not found or invalid
  }

  return null;
}

function initDatabase() {
  try {
    const dbPath = join(__dirname, 'skill-data.db');
    const dbExists = existsSync(dbPath);
    const database = new DatabaseSync(dbPath);
    
    database.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        score REAL NOT NULL
      )
    `);
    
    return { db: database, created: !dbExists };
  } catch (error) {
    return null;
  }
}

function runCheck(silent = false) {
  const version = getLatestVersion();
  
  if (!version) {
    console.error('Failed to retrieve the latest version');
    return null;
  }
  
  if (!silent) {
    console.log(`latest version found = ${version}`);
  }
  
  const dbResult = initDatabase();
  
  if (!dbResult) {
    console.error('failed to access info db');
    return null;
  }
  
  if (!silent) {
    console.log(dbResult.created ? 'info db created' : 'info db found');
  }
  
  return { version, db: dbResult.db };
}

function handleCheck() {
  const result = runCheck();
  
  if (!result) {
    process.exit(1);
  }
  
  result.db.close();
  process.exit(0);
}

function getVersionAverages(db) {
  const query = db.prepare(`
    SELECT version, AVG(score) as average, COUNT(*) as count
    FROM scores
    GROUP BY version
    ORDER BY id DESC
    LIMIT 10
  `);
  
  const results = query.all();
  return results;
}

function displayScoreHistory(db, version) {
  const averages = getVersionAverages(db);
  
  console.log('');
  console.log('-- Tool Scores history --');
  averages.forEach(row => {
    const isCurrent = row.version === version;
    const currentLabel = isCurrent ? ' - current' : '';
    console.log(`${row.version}${currentLabel} : ${Math.round(row.average)}%  (${row.count} uses)`);
  });
  
  console.log('');
  console.log('==');
  
  const currentAverage = averages.find(row => row.version === version);
  if (currentAverage) {
    console.log(`Current Skill version average score = ${Math.round(currentAverage.average)}%`);
  }
}

function handleInsert(scoreInput) {
  const cleanScore = typeof scoreInput === 'string' ? scoreInput.replace('%', '') : scoreInput;
  const score = parseFloat(cleanScore);
  
  if (isNaN(score) || score < 0 || score > 100) {
    console.error('Error: Score must be a number between 0 and 100');
    process.exit(1);
  }
  
  const result = runCheck(true);
  
  if (!result) {
    process.exit(1);
  }
  
  const { version, db } = result;
  
  try {
    const insert = db.prepare('INSERT INTO scores (version, score) VALUES (?, ?)');
    insert.run(version, score);
    
    displayScoreHistory(db, version);
    
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to insert score:', error.message);
    db.close();
    process.exit(1);
  }
}

function handleList() {
  const result = runCheck(true);
  
  if (!result) {
    process.exit(1);
  }
  
  const { version, db } = result;
  
  displayScoreHistory(db, version);
  
  db.close();
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.includes('--check')) {
  handleCheck();
} else if (args[0] === '--insert') {
  const scoreInput = args[1];
  handleInsert(scoreInput);
} else if (args.includes('--list')) {
  handleList();
} else {
  console.log('Usage:');
  console.log('  node score.js --check');
  console.log('  node score.js --insert <score>');
  console.log('  node score.js --list');
  process.exit(1);
}
