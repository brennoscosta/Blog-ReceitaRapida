import { listAvailableBuckets } from './s3Upload';

// Teste rápido para listar buckets
async function testS3() {
  console.log('🔍 Testando acesso S3...');
  const buckets = await listAvailableBuckets();
  console.log('Buckets encontrados:', buckets);
}

testS3().catch(console.error);