// ============================================================================
// DEPRECATED: This file is no longer used
// ============================================================================
//
// This legacy Express server was used before migration to Next.js 14 + tRPC.
// All API functionality has been migrated to tRPC routers in /server/trpc/routers/
//
// Migration completed: 2025-10-22
// - Express API routes → tRPC procedures
// - /api directory → /server/trpc/routers
// - Direct fetch() calls → tRPC client
//
// New development server: npm run dev (Next.js)
// Old development server: npm run dev:backend (this file - DEPRECATED)
//
// This file can be safely deleted in a future cleanup iteration.
// ============================================================================

console.log('');
console.log('⚠️  ========================================');
console.log('   DEPRECATED: Legacy Backend Server');
console.log('⚠️  ========================================');
console.log('');
console.log('This server is no longer maintained.');
console.log('The application has migrated to Next.js 14 + tRPC.');
console.log('');
console.log('Please use: npm run dev');
console.log('');
console.log('========================================');
console.log('');
process.exit(1);
