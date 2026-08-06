require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const tls = require('node:tls');
const https = require('node:https');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

async function main() {
  const systemCAs = tls.getCACertificates('system');
  const bundledCAs = tls.getCACertificates('bundled');
  console.log('system CAs:', systemCAs.length, 'bundled CAs:', bundledCAs.length);

  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        ca: [...bundledCAs, ...systemCAs],
        keepAlive: true,
      }),
    }),
  });

  try {
    const result = await client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: 'test/debug-upload-2.txt',
        Body: Buffer.from('test'),
        ContentType: 'text/plain',
      }),
    );
    console.log('Upload OK:', result.$metadata?.httpStatusCode);
  } catch (error) {
    console.error('Upload FAILED:', error.message);
  }
}

main();
