/**
 * Test Data Generation Script
 * Generates realistic test data for development and testing
 */

import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import pg from 'pg'

const { Pool } = pg

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'battleship_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
})

// Set default schema for all queries
pool.on('connect', (client) => {
  client.query('SET search_path TO battleship,public')
})

// Types
interface User {
  id: string
  username: string
  email: string
  password_hash: string
  display_name: string
  avatar_url: string
  rating: number
  games_played: number
  games_won: number
  country_code: string
  level: number
  experience_points: number
  created_at: Date
}

interface Game {
  id: string
  room_code: string
  player1_id: string
  player2_id: string
  game_mode: 'classic' | 'advanced' | 'blitz' | 'historical'
  status: 'waiting' | 'setup' | 'playing' | 'finished' | 'abandoned'
  winner_id?: string
  turn_count: number
  created_at: Date
  started_at?: Date
  finished_at?: Date
}

// Configuration
const CONFIG = {
  numUsers: parseInt(process.env.NUM_USERS || '100'),
  numGames: parseInt(process.env.NUM_GAMES || '500'),
  numTournaments: parseInt(process.env.NUM_TOURNAMENTS || '10'),
  batchSize: 100,
  passwordHash: '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe' // "password123"
}

// Helper functions
function generateUsername(): string {
  const adjectives = ['Swift', 'Brave', 'Iron', 'Silent', 'Thunder', 'Storm', 'Shadow', 'Crimson']
  const nouns = ['Admiral', 'Captain', 'Commander', 'Navigator', 'Gunner', 'Sailor', 'Pirate', 'Crusader']
  const adj = faker.helpers.arrayElement(adjectives)
  const noun = faker.helpers.arrayElement(nouns)
  const num = faker.number.int({ min: 1, max: 9999 })
  return `${adj}${noun}${num}`
}

function generateRoomCode(): string {
  return faker.string.alphanumeric({ length: 6, casing: 'upper' })
}

function generateRating(): number {
  // Generate ratings with normal distribution around 1200
  const mean = 1200
  const stdDev = 200
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const rating = Math.round(mean + z0 * stdDev)
  return Math.max(600, Math.min(2400, rating))
}

function calculateLevel(exp: number): number {
  return Math.floor(Math.sqrt(exp / 100)) + 1
}

// Data generation functions
async function generateUsers(count: number): Promise<User[]> {
  const users: User[] = []
  const usedUsernames = new Set<string>()
  const usedEmails = new Set<string>()

  for (let i = 0; i < count; i++) {
    let username = generateUsername()
    while (usedUsernames.has(username)) {
      username = generateUsername()
    }
    usedUsernames.add(username)

    let email = faker.internet.email().toLowerCase()
    while (usedEmails.has(email)) {
      email = faker.internet.email().toLowerCase()
    }
    usedEmails.add(email)

    const rating = generateRating()
    const gamesPlayed = faker.number.int({ min: 0, max: 500 })
    const winRate = faker.number.float({ min: 0.2, max: 0.8 })
    const gamesWon = Math.round(gamesPlayed * winRate)
    const exp = faker.number.int({ min: 0, max: 50000 })

    users.push({
      id: uuidv4(),
      username,
      email,
      password_hash: CONFIG.passwordHash,
      display_name: faker.person.fullName(),
      avatar_url: faker.image.avatar(),
      rating,
      games_played: gamesPlayed,
      games_won: gamesWon,
      country_code: faker.location.countryCode(),
      level: calculateLevel(exp),
      experience_points: exp,
      created_at: faker.date.past({ years: 2 })
    })
  }

  return users
}

async function generateGames(users: User[], count: number): Promise<Game[]> {
  const games: Game[] = []
  const gameModes: Game['game_mode'][] = ['classic', 'advanced', 'blitz', 'historical']
  const gameStatuses: Game['status'][] = ['waiting', 'setup', 'playing', 'finished', 'abandoned']

  for (let i = 0; i < count; i++) {
    const player1 = faker.helpers.arrayElement(users)
    let player2 = faker.helpers.arrayElement(users)
    while (player2.id === player1.id) {
      player2 = faker.helpers.arrayElement(users)
    }

    const status = faker.helpers.arrayElement(gameStatuses)
    const createdAt = faker.date.past({ years: 1 })
    const startedAt = status !== 'waiting' ? faker.date.soon({ days: 1, refDate: createdAt }) : undefined
    const finishedAt = status === 'finished' ? faker.date.soon({ days: 1, refDate: startedAt || createdAt }) : undefined

    const game: Game = {
      id: uuidv4(),
      room_code: generateRoomCode(),
      player1_id: player1.id,
      player2_id: status === 'waiting' ? player2.id : player2.id,
      game_mode: faker.helpers.arrayElement(gameModes),
      status,
      turn_count: status === 'finished' ? faker.number.int({ min: 20, max: 100 }) : faker.number.int({ min: 0, max: 50 }),
      created_at: createdAt,
      started_at: startedAt,
      finished_at: finishedAt
    }

    if (status === 'finished' && faker.datatype.boolean()) {
      game.winner_id = faker.helpers.arrayElement([player1.id, player2.id])
    }

    games.push(game)
  }

  return games
}

async function generateShipPlacements(gameId: string, playerId: string, shipTypes: any[]) {
  const placements = []
  const boardSize = 10
  const usedPositions = new Set<string>()

  for (const shipType of shipTypes) {
    const horizontal = faker.datatype.boolean()
    let placed = false
    let attempts = 0

    while (!placed && attempts < 100) {
      const x = faker.number.int({ min: 0, max: boardSize - (horizontal ? shipType.size : 1) })
      const y = faker.number.int({ min: 0, max: boardSize - (horizontal ? 1 : shipType.size) })

      const positions = []
      let valid = true

      for (let i = 0; i < shipType.size; i++) {
        const posX = horizontal ? x + i : x
        const posY = horizontal ? y : y + i
        const posKey = `${posX},${posY}`

        if (usedPositions.has(posKey)) {
          valid = false
          break
        }
        positions.push({ x: posX, y: posY })
      }

      if (valid) {
        positions.forEach(pos => usedPositions.add(`${pos.x},${pos.y}`))
        placements.push({
          id: uuidv4(),
          game_id: gameId,
          player_id: playerId,
          ship_type_id: shipType.id,
          positions: JSON.stringify(positions),
          orientation: horizontal ? 'horizontal' : 'vertical',
          is_sunk: false,
          hits: 0
        })
        placed = true
      }
      attempts++
    }
  }

  return placements
}

async function generateGameMoves(gameId: string, player1Id: string, player2Id: string, moveCount: number) {
  const moves = []
  const player1Hits = new Set<string>()
  const player2Hits = new Set<string>()

  for (let i = 0; i < moveCount; i++) {
    const isPlayer1Turn = i % 2 === 0
    const playerId = isPlayer1Turn ? player1Id : player2Id
    const targetHits = isPlayer1Turn ? player1Hits : player2Hits

    let x: number, y: number
    let key: string

    do {
      x = faker.number.int({ min: 0, max: 9 })
      y = faker.number.int({ min: 0, max: 9 })
      key = `${x},${y}`
    } while (targetHits.has(key))

    targetHits.add(key)

    const result = faker.helpers.weightedArrayElement([
      { value: 'miss', weight: 60 },
      { value: 'hit', weight: 35 },
      { value: 'sunk', weight: 5 }
    ])

    moves.push({
      id: uuidv4(),
      game_id: gameId,
      player_id: playerId,
      move_number: i + 1,
      x,
      y,
      result,
      response_time: faker.number.int({ min: 500, max: 30000 }),
      timestamp: faker.date.recent()
    })
  }

  return moves
}

async function generateChatMessages(gameId: string, player1Id: string, player2Id: string, count: number) {
  const messages = []
  const chatPhrases = [
    'Good luck!',
    'Nice shot!',
    'You got me!',
    'Miss!',
    'So close!',
    'Great game!',
    'Good strategy',
    'I\'ll get you next time!',
    'Well played',
    'That was lucky!',
    'gg',
    'rematch?'
  ]

  for (let i = 0; i < count; i++) {
    messages.push({
      id: uuidv4(),
      game_id: gameId,
      sender_id: faker.helpers.arrayElement([player1Id, player2Id]),
      message: faker.helpers.arrayElement(chatPhrases),
      message_type: faker.helpers.weightedArrayElement([
        { value: 'text', weight: 90 },
        { value: 'emoji', weight: 10 }
      ]),
      created_at: faker.date.recent()
    })
  }

  return messages
}

async function generateFriendships(users: User[], count: number) {
  const friendships = []
  const existingPairs = new Set<string>()

  for (let i = 0; i < count; i++) {
    const user1 = faker.helpers.arrayElement(users)
    let user2 = faker.helpers.arrayElement(users)

    while (user2.id === user1.id) {
      user2 = faker.helpers.arrayElement(users)
    }

    // Ensure ordered pair for uniqueness
    const [first, second] = user1.id < user2.id ? [user1, user2] : [user2, user1]
    const pairKey = `${first.id}-${second.id}`

    if (!existingPairs.has(pairKey)) {
      existingPairs.add(pairKey)

      friendships.push({
        id: uuidv4(),
        user1_id: first.id,
        user2_id: second.id,
        status: faker.helpers.weightedArrayElement([
          { value: 'accepted', weight: 70 },
          { value: 'pending', weight: 25 },
          { value: 'blocked', weight: 5 }
        ]),
        initiated_by: faker.helpers.arrayElement([first.id, second.id]),
        created_at: faker.date.past()
      })
    }
  }

  return friendships
}

// Database insertion functions
async function insertBatch(table: string, data: any[], columns: string[]) {
  if (data.length === 0) return

  const values = data.map(row =>
    `(${columns.map(col => {
      const val = row[col]
      if (val === null || val === undefined) return 'NULL'
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
      if (val instanceof Date) return `'${val.toISOString()}'`
      if (typeof val === 'object') return `'${JSON.stringify(val)}'::jsonb`
      return val
    }).join(', ')})`
  ).join(',\n')

  const query = `
    INSERT INTO battleship.${table} (${columns.join(', ')})
    VALUES ${values}
    ON CONFLICT DO NOTHING;
  `

  try {
    await pool.query(query)
    console.log(`✓ Inserted ${data.length} records into ${table}`)
  } catch (error) {
    console.error(`✗ Error inserting into ${table}:`, error)
    throw error
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting test data generation...')
    console.log(`   Users: ${CONFIG.numUsers}`)
    console.log(`   Games: ${CONFIG.numGames}`)
    console.log(`   Tournaments: ${CONFIG.numTournaments}`)

    // Connect to database
    await pool.query('SET search_path TO battleship, public')

    // Generate users
    console.log('\n📝 Generating users...')
    const users = await generateUsers(CONFIG.numUsers)
    await insertBatch('users', users, [
      'id', 'username', 'email', 'password_hash', 'display_name',
      'avatar_url', 'rating', 'games_played', 'games_won',
      'country_code', 'level', 'experience_points', 'created_at'
    ])

    // Generate games
    console.log('\n🎮 Generating games...')
    const games = await generateGames(users, CONFIG.numGames)
    await insertBatch('games', games, [
      'id', 'room_code', 'player1_id', 'player2_id', 'game_mode',
      'status', 'winner_id', 'turn_count', 'created_at',
      'started_at', 'finished_at'
    ])

    // Generate ship placements for active games
    console.log('\n🚢 Generating ship placements...')
    const activeGames = games.filter(g => g.status === 'playing' || g.status === 'finished')

    // Get ship types from database
    const shipTypesResult = await pool.query(`
      SELECT id, name, size FROM battleship.ship_types
      WHERE name IN ('Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer')
    `)
    const shipTypes = shipTypesResult.rows

    for (const game of activeGames.slice(0, 50)) { // Limit to 50 games for performance
      const player1Placements = await generateShipPlacements(game.id, game.player1_id, shipTypes)
      const player2Placements = await generateShipPlacements(game.id, game.player2_id, shipTypes)

      await insertBatch('ship_placements', [...player1Placements, ...player2Placements], [
        'id', 'game_id', 'player_id', 'ship_type_id', 'positions',
        'orientation', 'is_sunk', 'hits'
      ])
    }

    // Generate game moves
    console.log('\n🎯 Generating game moves...')
    const playingGames = games.filter(g => g.status === 'playing' || g.status === 'finished')

    for (const game of playingGames.slice(0, 30)) { // Limit to 30 games
      const moves = await generateGameMoves(
        game.id,
        game.player1_id,
        game.player2_id,
        game.turn_count
      )

      if (moves.length > 0) {
        await insertBatch('game_moves', moves, [
          'id', 'game_id', 'player_id', 'move_number',
          'x', 'y', 'result', 'response_time', 'timestamp'
        ])
      }
    }

    // Generate chat messages
    console.log('\n💬 Generating chat messages...')
    for (const game of games.filter(g => g.status !== 'waiting').slice(0, 50)) {
      const messageCount = faker.number.int({ min: 2, max: 15 })
      const messages = await generateChatMessages(
        game.id,
        game.player1_id,
        game.player2_id,
        messageCount
      )

      if (messages.length > 0) {
        await insertBatch('chat_messages', messages, [
          'id', 'game_id', 'sender_id', 'message', 'message_type', 'created_at'
        ])
      }
    }

    // Generate friendships
    console.log('\n👥 Generating friendships...')
    const friendships = await generateFriendships(users, Math.min(CONFIG.numUsers * 2, 500))
    await insertBatch('friendships', friendships, [
      'id', 'user1_id', 'user2_id', 'status', 'initiated_by', 'created_at'
    ])

    // Update statistics
    console.log('\n📊 Updating statistics...')
    await pool.query(`
      UPDATE battleship.users u
      SET total_shots_fired = (
        SELECT COUNT(*) FROM battleship.game_moves gm
        WHERE gm.player_id = u.id
      ),
      total_hits = (
        SELECT COUNT(*) FROM battleship.game_moves gm
        WHERE gm.player_id = u.id AND gm.result IN ('hit', 'sunk')
      ),
      ships_sunk = (
        SELECT COUNT(*) FROM battleship.game_moves gm
        WHERE gm.player_id = u.id AND gm.result = 'sunk'
      )
    `)

    console.log('\n✅ Test data generation complete!')

    // Show summary
    const summaryQuery = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM battleship.users) as users,
        (SELECT COUNT(*) FROM battleship.games) as games,
        (SELECT COUNT(*) FROM battleship.ship_placements) as placements,
        (SELECT COUNT(*) FROM battleship.game_moves) as moves,
        (SELECT COUNT(*) FROM battleship.chat_messages) as messages,
        (SELECT COUNT(*) FROM battleship.friendships) as friendships
    `)

    console.log('\n📈 Database Summary:')
    const summary = summaryQuery.rows[0]
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`)
    })

  } catch (error) {
    console.error('❌ Error generating test data:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { generateUsers, generateGames, generateShipPlacements, generateGameMoves }