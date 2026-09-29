const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env.local into process.env (simple parser, avoids adding dotenv dependency)
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContents = fs.readFileSync(envPath, 'utf8')
  envContents.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!match) return
    let key = match[1]
    let val = match[2] || ''
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    process.env[key] = val
  })
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Set it in .env.local or environment.')
    process.exit(1)
  }

  const sqlPath = path.resolve(__dirname, '..', 'migrations', 'init.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') || process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  })

  try {
    await client.connect()
    console.log('Connected to DB — running migration...')
    await client.query(sql)
    console.log('Migration applied successfully')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()
