const AWS = require('aws-sdk');

const ec2 = new AWS.EC2({
  region: 'us-east-1',
});

async function detectUnusedEbs() {

  const findings = [];

  const volumes = await ec2
    .describeVolumes()
    .promise();

  for (const volume of volumes.Volumes) {

    if (volume.State === 'available') {

      findings.push({
        volumeId: volume.VolumeId,
        size: volume.Size,
        state: volume.State,
        recommendation:
          'Unattached EBS volume wasting storage cost',
      });
    }
  }

  return findings;
}

module.exports = detectUnusedEbs;