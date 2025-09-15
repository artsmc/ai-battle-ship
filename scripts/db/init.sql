-- Battleship Naval Strategy Game Database Schema
-- Initial database setup for PostgreSQL with Electric SQL support

-- Create database if not exists (run as superuser)
-- CREATE DATABASE battleship_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI features

-- Create schema
CREATE SCHEMA IF NOT EXISTS battleship;
SET search_path TO battleship, public;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT false
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) UNIQUE,
    player1_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_state JSONB NOT NULL DEFAULT '{}',
    game_mode VARCHAR(20) NOT NULL DEFAULT 'classic', -- classic, advanced, blitz
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, setup, playing, finished, abandoned
    current_turn UUID,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    turn_count INTEGER DEFAULT 0,
    time_limit INTEGER, -- seconds per turn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ship placements table
CREATE TABLE IF NOT EXISTS ship_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_type VARCHAR(20) NOT NULL, -- carrier, battleship, cruiser, submarine, destroyer
    positions JSONB NOT NULL, -- Array of {x, y} coordinates
    is_sunk BOOLEAN DEFAULT false,
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_id, ship_type)
);

-- Game moves/shots table
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    result VARCHAR(10) NOT NULL, -- hit, miss, sunk
    ship_type VARCHAR(20), -- if hit, which ship type
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER, -- milliseconds to make the move
    UNIQUE(game_id, move_number)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, emoji, system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.rating,
    u.games_played,
    u.games_won,
    CASE
        WHEN u.games_played > 0
        THEN ROUND((u.games_won::NUMERIC / u.games_played) * 100, 2)
        ELSE 0
    END as win_rate,
    u.is_online,
    u.last_active
FROM users u
WHERE u.games_played >= 5 -- Minimum games for leaderboard
ORDER BY u.rating DESC;

-- Game history view
CREATE OR REPLACE VIEW game_history AS
SELECT
    g.id,
    g.room_code,
    g.player1_id,
    p1.username as player1_username,
    g.player2_id,
    p2.username as player2_username,
    g.game_mode,
    g.status,
    g.winner_id,
    w.username as winner_username,
    g.turn_count,
    g.created_at,
    g.started_at,
    g.finished_at,
    EXTRACT(EPOCH FROM (g.finished_at - g.started_at)) as duration_seconds
FROM games g
LEFT JOIN users p1 ON g.player1_id = p1.id
LEFT JOIN users p2 ON g.player2_id = p2.id
LEFT JOIN users w ON g.winner_id = w.id;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_ship_placements_game ON ship_placements(game_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_game ON game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON chat_messages(game_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Electric SQL specific: replication settings
-- These are required for Electric SQL to work properly
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE ship_placements REPLICA IDENTITY FULL;
ALTER TABLE game_moves REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Grant permissions for Electric SQL user
GRANT ALL PRIVILEGES ON SCHEMA battleship TO electric;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA battleship TO electric;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA battleship TO electric;