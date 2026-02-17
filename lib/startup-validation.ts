/**
 * Startup Validation
 * Validates critical environment variables and connections on server start
 */

export async function validateStartup() {
  const warnings: string[] = []

  console.log('\n[STARTUP] Validating OneselfAI Platform...\n')

  // 1. Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET not set - using development default')
  }

  // 2. Check POSTGRES_URL
  if (!process.env.POSTGRES_URL) {
    warnings.push('POSTGRES_URL not set - using default local PostgreSQL: postgresql://postgres:postgres@localhost:5432/oneselai')
  }

  // 3. Check MONGODB_URI
  if (!process.env.MONGODB_URI) {
    warnings.push('MONGODB_URI not set - using default local MongoDB: mongodb://localhost:27017/oneselai')
  }

  // 4. Test PostgreSQL connection
  try {
    const { getPool } = await import('./postgres')
    const pool = getPool()
    await pool.query('SELECT NOW()')
    console.log('[STARTUP] PostgreSQL connection successful')
  } catch (err) {
    warnings.push(`PostgreSQL connection failed: ${(err as Error).message}`)
  }

  // 5. Node environment
  console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)

  // 6. Report warnings
  if (warnings.length > 0) {
    console.warn('[STARTUP] WARNINGS:\n')
    warnings.forEach((warn) => console.warn(`  - ${warn}`))
    console.warn('\n')
  }

  console.log('[STARTUP] Validation complete\n')
}
