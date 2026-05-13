require('newrelic');

const newrelic = require('newrelic');
console.log('New Relic agent loaded');
console.log(newrelic);
const express = require('express');
const fs = require('fs');
const path = require('path');
const client = require('prom-client');

const app = express();
const port = 4000;

// Prometheus metric
const awsCostGauge = new client.Gauge({
  name: 'aws_service_cost',
  help: 'AWS cost per service',
  labelNames: ['service'],
});

function loadLatestCostFile() {

  // Correct path to PROJECT_ROOT/data
  const dataDir = path.join(__dirname, '..', 'data');

  const files = fs
    .readdirSync(dataDir)
    .filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    throw new Error('No cost data files found');
  }

  // Get latest file
  const latestFile = files.sort().reverse()[0];

  return JSON.parse(
    fs.readFileSync(
      path.join(dataDir, latestFile)
    )
  );
}

function updateMetrics() {

  const data = loadLatestCostFile();

  const results = data.ResultsByTime;

  results.forEach(day => {

    day.Groups.forEach(group => {

      const service = group.Keys[0];

      const cost = parseFloat(
        group.Metrics.UnblendedCost.Amount
      );

      // Prometheus metric
      awsCostGauge.set(
        { service },
        cost
      );

      // New Relic custom event
      newrelic.recordCustomEvent(
        'AwsCostMetric',
        {
          service,
          cost,
        }
      );

      console.log(
        `Sent metric -> ${service}: $${cost}`
      );
    });
  });
}

// Prometheus endpoint
app.get('/metrics', async (req, res) => {

  try {

    updateMetrics();

    res.set(
      'Content-Type',
      client.register.contentType
    );

    res.end(
      await client.register.metrics()
    );

  } catch (error) {

    console.error(error);

    res.status(500).send(error.message);
  }
});

// Root endpoint for browser testing
app.get('/', async (req, res) => {

  try {

    updateMetrics();

    res.send(
      'AWS cost metrics sent to New Relic'
    );

  } catch (error) {

    console.error(error);

    res.status(500).send(error.message);
  }
});

app.listen(port, () => {

  console.log(
    `Metrics server running on port ${port}`
  );
});