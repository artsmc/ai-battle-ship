import { NextResponse } from 'next/server'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database?: {
      status: 'connected' | 'disconnected'
      latency?: number
    }
    redis?: {
      status: 'connected' | 'disconnected'
      latency?: number
    }
    electric?: {
      status: 'connected' | 'disconnected'
      latency?: number
    }
  }
  environment: string
  uptime: number
}

// Track server start time
const serverStartTime = Date.now()

async function checkDatabaseHealth(): Promise<{
  status: 'connected' | 'disconnected'
  latency?: number
}> {
  if (!process.env.DATABASE_URL) {
    return { status: 'disconnected' }
  }

  try {
    const start = Date.now()
    // Add your database ping logic here
    // Example: await db.query('SELECT 1')
    const latency = Date.now() - start

    return {
      status: 'connected',
      latency,
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { status: 'disconnected' }
  }
}

async function checkRedisHealth(): Promise<{
  status: 'connected' | 'disconnected'
  latency?: number
}> {
  if (!process.env.REDIS_URL) {
    return { status: 'disconnected' }
  }

  try {
    const start = Date.now()
    // Add your Redis ping logic here
    // Example: await redis.ping()
    const latency = Date.now() - start

    return {
      status: 'connected',
      latency,
    }
  } catch (error) {
    console.error('Redis health check failed:', error)
    return { status: 'disconnected' }
  }
}

async function checkElectricHealth(): Promise<{
  status: 'connected' | 'disconnected'
  latency?: number
}> {
  if (!process.env.ELECTRIC_SERVICE_URL) {
    return { status: 'disconnected' }
  }

  try {
    const start = Date.now()
    const response = await fetch(`${process.env.ELECTRIC_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - start

    return {
      status: response.ok ? 'connected' : 'disconnected',
      latency,
    }
  } catch (error) {
    console.error('Electric SQL health check failed:', error)
    return { status: 'disconnected' }
  }
}

export async function GET() {
  try {
    // Run health checks in parallel
    const [database, redis, electric] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkElectricHealth(),
    ])

    // Calculate overall status
    const allConnected =
      database.status === 'connected' &&
      redis.status === 'connected' &&
      electric.status === 'connected'

    const someConnected =
      database.status === 'connected' ||
      redis.status === 'connected' ||
      electric.status === 'connected'

    const status: HealthStatus['status'] = allConnected
      ? 'healthy'
      : someConnected
      ? 'degraded'
      : 'unhealthy'

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      services: {
        database,
        redis,
        electric,
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    }

    // Set appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

// Simple HEAD request for quick health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}