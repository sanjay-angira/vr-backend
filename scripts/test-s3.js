require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function main() {
  console.log('Region:', process.env.AWS_REGION);
  console.log('Bucket:', process.env.AWS_S3_BUCKET);
  console.log('AccessKey set:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('SecretKey set:', !!process.env.AWS_SECRET_ACCESS_KEY);

  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const result = await client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: 'test/debug-upload.txt',
        Body: Buffer.from('test'),
        ContentType: 'text/plain',
      }),
    );
    console.log('Upload OK:', result.$metadata?.httpStatusCode);
  } catch (error) {
    console.error('Upload FAILED:', error.name, error.message);
    if (error.$metadata) console.error('Metadata:', error.$metadata);
  }
}

main();
