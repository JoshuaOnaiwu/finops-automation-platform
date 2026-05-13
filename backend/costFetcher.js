const AWS = require('aws-sdk');
const fs = require('fs');

const costExplorer = new AWS.CostExplorer({
  region: 'us-east-1',
});

async function fetchCostData() {

  // Dynamic rolling 7-day window
  const endDate = new Date();
  const startDate = new Date();

  startDate.setDate(endDate.getDate() - 7);

  const params = {
    TimePeriod: {
      Start: startDate.toISOString().split('T')[0],
      End: endDate.toISOString().split('T')[0],
    },
    Granularity: 'DAILY',
    Metrics: ['UnblendedCost'],
    GroupBy: [
      {
        Type: 'DIMENSION',
        Key: 'SERVICE',
      },
    ],
  };

  try {

    // Fetch AWS cost data
    const data = await costExplorer
      .getCostAndUsage(params)
      .promise();

    // Print JSON to workflow logs
    console.log(
      JSON.stringify(data, null, 2)
    );

    // Create data directory if missing
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }

    // Generate filename
    const filename = `./data/cost-${Date.now()}.json`;

    // Save JSON locally
    fs.writeFileSync(
      filename,
      JSON.stringify(data, null, 2)
    );

    console.log(`Cost data saved successfully: ${filename}`);

  } catch (error) {

    console.error('Error fetching cost data:', error);

    process.exit(1);
  }
}

fetchCostData();