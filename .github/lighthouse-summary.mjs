// Turns a Lighthouse JSON report into one row of the workflow's job summary. Information only:
// the hosted runners vary far more than the page does, so nothing here fails the build.
import { readFile, appendFile } from 'node:fs/promises';

const [, , file, label] = process.argv;
const report = JSON.parse(await readFile(file, 'utf8'));
const pct = (name) => Math.round((report.categories[name]?.score ?? 0) * 100);
const audit = (name) => report.audits[name].numericValue;

const row = [
  label,
  pct('performance'),
  pct('accessibility'),
  pct('best-practices'),
  pct('seo'),
  `${Math.round(audit('total-blocking-time'))} ms`,
  `${(audit('largest-contentful-paint') / 1000).toFixed(2)} s`,
  audit('cumulative-layout-shift').toFixed(3),
  `${Math.round(audit('total-byte-weight') / 1024)} KB`,
].join(' | ');

console.log(row);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `| ${row} |\n`);
}
