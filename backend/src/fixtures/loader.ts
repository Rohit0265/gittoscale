import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArchitectureFixture, ScenarioFixture } from '../simulation/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFixtureFile(filename: string): string {
  // Check candidate paths:
  const candidates = [
    path.resolve(process.cwd(), 'fixtures', filename),
    path.resolve(process.cwd(), '..', 'fixtures', filename),
    path.resolve(__dirname, '../../../fixtures', filename),
    path.resolve(__dirname, '../../fixtures', filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Fixture file "${filename}" not found in candidate paths.`);
}

let cachedArchitecture: ArchitectureFixture | null = null;
let cachedScenarios: ScenarioFixture[] | null = null;

export function getArchitectureFixture(fresh = false): ArchitectureFixture {
  if (cachedArchitecture && !fresh) {
    return JSON.parse(JSON.stringify(cachedArchitecture));
  }
  const filePath = findFixtureFile('architecture.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ArchitectureFixture;
  cachedArchitecture = data;
  return JSON.parse(JSON.stringify(data));
}

export function getScenariosFixture(fresh = false): ScenarioFixture[] {
  if (cachedScenarios && !fresh) {
    return JSON.parse(JSON.stringify(cachedScenarios));
  }
  const filePath = findFixtureFile('scenarios.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ScenarioFixture[];
  cachedScenarios = data;
  return JSON.parse(JSON.stringify(data));
}
