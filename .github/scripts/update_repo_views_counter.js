const fs = require('fs');
const path = require('path');

const REPO = process.env.REPO;
const GITHUB_TOKEN = process.env.TRAFFIC_TOKEN;
const METRICS_FILE = 'metrics.json';

if (!GITHUB_TOKEN || !REPO) {
  console.error('Error: TRAFFIC_TOKEN and REPO environment variables must be set.');
  process.exit(1);
}

if (typeof fetch !== 'function') {
  console.error('Error: global fetch is not available. Use Node.js 20 or later.');
  process.exit(1);
}

async function getLast14DaysTraffic() {
  const response = await fetch(`https://api.github.com/repos/${REPO}/traffic/views`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'visitor-counter'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch traffic data: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  return data.views.map((item) => ({
    date: item.timestamp.slice(0, 10),
    count: item.count,
    uniques: item.uniques
  }));
}

function readMetrics() {
  if (!fs.existsSync(METRICS_FILE)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(METRICS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('metrics.json is not valid JSON. Starting fresh.');
    return [];
  }
}

function writeMetrics(metrics) {
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  console.log(`metrics.json updated with ${metrics.length} days`);
}

function mergeMetrics(existing, fetched) {
  const byDate = new Map();

  for (const entry of existing) {
    byDate.set(entry.date, entry);
  }

  for (const entry of fetched) {
    byDate.set(entry.date, entry);
  }

  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function calculateTotalViews(metrics) {
  return metrics.reduce((sum, entry) => sum + entry.count, 0);
}

function findMarkdownFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function updateMarkdownBadges(totalViews) {
  const refreshDate = new Date().toISOString().split('T')[0];
  const badgeRegex = /<!-- START BADGE -->[\s\S]*?<!-- END BADGE -->/g;
  const badgeBlock = `<!-- START BADGE -->
<div align="center">
  <img src="https://img.shields.io/badge/Total%20views-${totalViews}-limegreen" alt="Total views">
  <p>Refresh Date: ${refreshDate}</p>
</div>
<!-- END BADGE -->`;

  for (const file of findMarkdownFiles('.')) {
    const content = fs.readFileSync(file, 'utf-8');
    if (!badgeRegex.test(content)) {
      continue;
    }

    const updated = content.replace(badgeRegex, badgeBlock);
    fs.writeFileSync(file, updated);
    console.log(`Updated badge in ${file}`);
  }
}

(async () => {
  try {
    const fetched = await getLast14DaysTraffic();
    const existing = readMetrics();
    const merged = mergeMetrics(existing, fetched);
    writeMetrics(merged);

    const totalViews = calculateTotalViews(merged);
    updateMarkdownBadges(totalViews);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();