// Optional New Relic agent
// require('newrelic');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const client = require('prom-client');

const app = express();

const port = process.env.PORT || 4000;

const AWS_REGION =
  process.env.AWS_REGION || 'us-east-1';

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(__dirname, '..', 'data');

const FRONTEND_DIST =
  path.join(__dirname, 'dist');

// Prometheus registry
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

// AWS cost metric
const awsCostGauge = new client.Gauge({
  name: 'aws_service_cost',
  help: 'AWS cost per service',
  labelNames: ['service'],
});

register.registerMetric(awsCostGauge);

// Middleware
app.use(cors());

app.use(express.json());

// Mock catalogue data
const products = [
  {
    id: 1,
    name: 'Black Urban Jacket',
    category: 'Jackets',
    price: 120,
  },
  {
    id: 2,
    name: 'White Premium Tee',
    category: 'T-Shirts',
    price: 45,
  },
  {
    id: 3,
    name: 'Red Street Hoodie',
    category: 'Hoodies',
    price: 95,
  },
];

// Load latest AWS cost file
function loadLatestCostFile() {

  if (!fs.existsSync(DATA_DIR)) {

    throw new Error(
      `Cost data directory not found: ${DATA_DIR}`
    );
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {

    throw new Error(
      'No cost data files found'
    );
  }

  const latestFile = files[0];

  const filePath = path.join(
    DATA_DIR,
    latestFile
  );

  const raw = fs.readFileSync(
    filePath,
    'utf8'
  );

  return JSON.parse(raw);
}

// Update Prometheus metrics
function updateMetrics() {

  const data = loadLatestCostFile();

  const results =
    data.ResultsByTime || [];

  // Prevent duplicate metrics
  awsCostGauge.reset();

  results.forEach(day => {

    (day.Groups || []).forEach(group => {

      const service =
        group.Keys?.[0] || 'unknown';

      const cost = parseFloat(
        group.Metrics?.UnblendedCost?.Amount || '0'
      );

      // Prometheus metric
      awsCostGauge.set(
        { service },
        cost
      );

      // Optional New Relic custom event
      if (
        typeof global.newrelic?.recordCustomEvent ===
        'function'
      ) {

        global.newrelic.recordCustomEvent(
          'AwsCostMetric',
          {
            service,
            cost,
            region: AWS_REGION,
          }
        );
      }
    });
  });
}

// ==========================
// HEALTH ENDPOINT
// ==========================

app.get('/health', (req, res) => {

  res.status(200).json({
    status: 'ok',
    service: 'finops-platform',
    region: AWS_REGION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// API ROUTES
// ==========================

app.get('/api/catalogue', (req, res) => {

  res.json(products);
});

app.post('/api/login', (req, res) => {

  const { username } = req.body;

  res.json({
    token: 'demo-token',
    user: {
      username,
      role: 'customer',
    },
  });
});

app.get('/api/cart', (req, res) => {

  res.json({
    items: [],
    itemCount: 0,
    subtotal: 0,
    delivery: 0,
    total: 0,
  });
});

app.post('/api/checkout', (req, res) => {

  res.json({
    message: 'Checkout successful',
    orderId: Math.floor(
      Math.random() * 100000
    ),
  });
});

// ==========================
// METRICS ENDPOINT
// ==========================

app.get('/metrics', async (req, res) => {

  try {

    updateMetrics();

    res.set(
      'Content-Type',
      register.contentType
    );

    res.end(
      await register.metrics()
    );

  } catch (error) {

    console.error(
      'Error generating metrics:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// ==========================
// FRONTEND STATIC SERVING
// ==========================

if (
  fs.existsSync(
    path.join(
      FRONTEND_DIST,
      'index.html'
    )
  )
) {

  app.use(
    express.static(FRONTEND_DIST)
  );

  app.use((req, res, next) => {

    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/metrics') ||
      req.path.startsWith('/health')
    ) {

      return next();
    }

    res.sendFile(
      path.join(
        FRONTEND_DIST,
        'index.html'
      )
    );
  });

} else {

  app.get('/', (req, res) => {

    res.json({
      message:
        'FinOps backend is running',
      region: AWS_REGION,
      status: 'healthy',
    });
  });
}

// ==========================
// SERVER STARTUP
// ==========================

app.listen(port, () => {

  console.log(`
=====================================
FinOps Platform Started
=====================================
Port: ${port}
Region: ${AWS_REGION}
Data Directory: ${DATA_DIR}
Health: /health
Metrics: /metrics
=====================================
  `);
});