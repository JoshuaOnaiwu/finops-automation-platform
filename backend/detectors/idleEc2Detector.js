const AWS = require('aws-sdk');

const ec2 = new AWS.EC2({
  region: 'us-east-1',
});

const cloudwatch = new AWS.CloudWatch({
  region: 'us-east-1',
});

async function detectIdleEc2() {

  const findings = [];

  const instances = await ec2
    .describeInstances()
    .promise();

  for (const reservation of instances.Reservations) {

    for (const instance of reservation.Instances) {

      const instanceId = instance.InstanceId;

      const metrics = await cloudwatch
        .getMetricStatistics({
          Namespace: 'AWS/EC2',
          MetricName: 'CPUUtilization',
          Dimensions: [
            {
              Name: 'InstanceId',
              Value: instanceId,
            },
          ],
          StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          EndTime: new Date(),
          Period: 86400,
          Statistics: ['Average'],
        })
        .promise();

      const datapoints = metrics.Datapoints;

      if (datapoints.length === 0) {
        continue;
      }

      const avgCpu =
        datapoints.reduce(
          (sum, point) => sum + point.Average,
          0
        ) / datapoints.length;

      if (avgCpu < 5) {

        findings.push({
          instanceId,
          avgCpu: avgCpu.toFixed(2),
          recommendation:
            'Potential idle EC2 instance',
        });
      }
    }
  }

  return findings;
}

module.exports = detectIdleEc2;