const fs = require('fs');
const path = require('path');

function loadLatestCostFile() {

  const dataDir = path.join(
    __dirname,
    '..',
    '..',
    'data'
  );

  const files = fs
    .readdirSync(dataDir)
    .filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    throw new Error('No cost data files found');
  }

  const latestFile = files.sort().reverse()[0];

  return JSON.parse(
    fs.readFileSync(
      path.join(dataDir, latestFile)
    )
  );
}

async function detectCostSpikes() {

  const findings = [];

  const data = loadLatestCostFile();

  const results = data.ResultsByTime;

  for (let i = 1; i < results.length; i++) {

    const previousDay = results[i - 1];
    const currentDay = results[i];

    // Sum previous day service costs
    const previousTotal =
      previousDay.Groups.reduce(
        (sum, group) =>
          sum +
          parseFloat(
            group.Metrics.UnblendedCost.Amount
          ),
        0
      );

    // Sum current day service costs
    const currentTotal =
      currentDay.Groups.reduce(
        (sum, group) =>
          sum +
          parseFloat(
            group.Metrics.UnblendedCost.Amount
          ),
        0
      );

    // Avoid divide-by-zero
    if (previousTotal === 0) {
      continue;
    }

    const increasePercent =
      (
        (
          currentTotal - previousTotal
        ) / previousTotal
      ) * 100;

    // Detect spikes above 30%
    if (increasePercent > 30) {

      findings.push({
        date: currentDay.TimePeriod.Start,

        previousCost:
          previousTotal.toFixed(2),

        currentCost:
          currentTotal.toFixed(2),

        increasePercent:
          increasePercent.toFixed(2),

        recommendation:
          'Investigate sudden AWS cost spike',
      });
    }
  }

  return findings;
}

module.exports = detectCostSpikes;