import crypto from 'crypto';
import { prisma } from '../src/config/db.js';
import { hashSha256 } from '../src/utils/crypto.js';
import { redis } from '../src/config/redis.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  console.log('====================================================');
  console.log(' Saathi API Key Lifecycle Management Tool');
  console.log('====================================================\n');

  if (!command || command === 'help') {
    console.log('Usage:');
    console.log('  npx tsx scripts/manage-api-keys.ts list');
    console.log('  npx tsx scripts/manage-api-keys.ts create <name> <frontend|ivr_webhook|admin_tool>');
    console.log('  npx tsx scripts/manage-api-keys.ts rotate <keyId>');
    console.log('  npx tsx scripts/manage-api-keys.ts revoke <keyId>');
    process.exit(0);
  }

  if (command === 'list') {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${keys.length} API keys:\n`);
    keys.forEach((k) => {
      console.log(`- ID: ${k.id}`);
      console.log(`  Name: ${k.name}`);
      console.log(`  Type: ${k.type}`);
      console.log(`  Scopes: ${k.scopes}`);
      console.log(`  Active: ${k.isActive}`);
      console.log(`  Last Used: ${k.lastUsedAt ? k.lastUsedAt.toISOString() : 'Never'}`);
      console.log(`  Revoked: ${k.revokedAt ? k.revokedAt.toISOString() : 'No'}\n`);
    });
  } else if (command === 'create') {
    const name = args[1];
    const typeInput = (args[2] || 'frontend').toUpperCase() as 'FRONTEND' | 'IVR_WEBHOOK' | 'ADMIN_TOOL';

    if (!name) {
      console.error('Error: Please provide a name for the key. Example: create "Mobile Web" frontend');
      process.exit(1);
    }

    const scopeMap: Record<string, string[]> = {
      FRONTEND: ['frontend'],
      IVR_WEBHOOK: ['ivr_webhook'],
      ADMIN_TOOL: ['admin_tool'],
    };

    const scopes = scopeMap[typeInput] || ['frontend'];
    const rawKey = `saathi_${typeInput.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = hashSha256(rawKey);

    const created = await prisma.apiKey.create({
      data: {
        name,
        type: typeInput,
        keyHash,
        scopes: JSON.stringify(scopes),
        rateLimit: typeInput === 'FRONTEND' ? 300 : 120,
        isActive: true,
      },
    });

    console.log('API Key created successfully!\n');
    console.log(`ID:      ${created.id}`);
    console.log(`Name:    ${created.name}`);
    console.log(`Type:    ${created.type}`);
    console.log(`Scopes:  ${JSON.stringify(scopes)}`);
    console.log('\n----------------------------------------------------');
    console.log('RAW API KEY (PRINTED ONLY ONCE - SAVE IMMEDIATELY):');
    console.log(rawKey);
    console.log('----------------------------------------------------\n');
  } else if (command === 'rotate') {
    const keyId = args[1];
    if (!keyId) {
      console.error('Error: Please provide a key ID to rotate.');
      process.exit(1);
    }

    const existing = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!existing) {
      console.error(`Error: API Key with ID '${keyId}' not found.`);
      process.exit(1);
    }

    // Invalidate old key cache
    await redis.del(`apikey:cache:${existing.keyHash}`);

    // Generate new raw key and hash
    const newRawKey = `saathi_${existing.type.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;
    const newKeyHash = hashSha256(newRawKey);

    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        keyHash: newKeyHash,
        isActive: true,
        revokedAt: null,
      },
    });

    console.log('API Key rotated successfully!\n');
    console.log(`ID:      ${existing.id}`);
    console.log(`Name:    ${existing.name}`);
    console.log('\n----------------------------------------------------');
    console.log('NEW RAW API KEY (PRINTED ONLY ONCE):');
    console.log(newRawKey);
    console.log('----------------------------------------------------\n');
  } else if (command === 'revoke') {
    const keyId = args[1];
    if (!keyId) {
      console.error('Error: Please provide a key ID to revoke.');
      process.exit(1);
    }

    const existing = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!existing) {
      console.error(`Error: API Key with ID '${keyId}' not found.`);
      process.exit(1);
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    await redis.del(`apikey:cache:${existing.keyHash}`);

    console.log(`API Key '${existing.name}' (${keyId}) has been revoked.`);
  } else {
    console.error(`Unknown command '${command}'. Use 'help' for usage.`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
