const fs = require('fs');
const path = require('path');

const detectIdleEc2 =
  require('./idleEc2Detector');

const detectUnusedEbs =
  require('./ebsWasteDetector');

const detectCostSpikes =
  require('./costSpikeDetector');

async function runDetections() {

  const findings = {
    timestamp: new Date().toISOString(),

    idleEc2Findings: [],

    unusedEbsFindings: [],

    costSpikeFindings: [],
  };

  // Run idle EC2 detection
  console.log(
    'Running idle EC2 detection...'
  );

  findings.idleEc2Findings =
    await detectIdleEc2();

  // Run unused EBS detection
  console.log(
    'Running unused EBS detection...'
  );

  findings.unusedEbsFindings =
    await detectUnusedEbs();

  // Run cost spike detection
  console.log(
    'Running cost spike detection...'
  );

  findings.costSpikeFindings =
    await detectCostSpikes();

  // Findings output directory
  const outputDir = path.join(
    __dirname,
    '..',
    'findings'
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Generate findings filename
  const filename = path.join(
    outputDir,
    `findings-${Date.now()}.json`
  );

  // Save findings
  fs.writeFileSync(
    filename,
    JSON.stringify(findings, null, 2)
  );

  console.log(
    `Findings saved to ${filename}`
  );

  // Print findings
  console.log(
    JSON.stringify(findings, null, 2)
  );
}

runDetections();