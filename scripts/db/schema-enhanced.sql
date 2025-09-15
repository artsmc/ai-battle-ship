-- Enhanced Battleship Naval Strategy Game Database Schema
-- Complete database schema with historical ship types and advanced features

-- Create database if not exists (run as superuser)
-- CREATE DATABASE battleship_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI features
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create schema
CREATE SCHEMA IF NOT EXISTS battleship;
SET search_path TO battleship, public;

-- =============================================
-- ENUM TYPES
-- =============================================

-- Ship era classification
CREATE TYPE ship_era AS ENUM (
    'pre_dreadnought',    -- 1890-1906
    'dreadnought',        -- 1906-1920
    'super_dreadnought',  -- 1920-1945
    'battlecruiser',      -- 1908-1945
    'modern',             -- 1945-present
    'fictional'           -- Game-specific designs
);

-- Ship class types
CREATE TYPE ship_class AS ENUM (
    'carrier',
    'battleship',
    'battlecruiser',
    'heavy_cruiser',
    'light_cruiser',
    'destroyer',
    'submarine',
    'frigate',
    'corvette',
    'patrol_boat'
);

-- Game modes
CREATE TYPE game_mode AS ENUM (
    'classic',
    'advanced',
    'blitz',
    'campaign',
    'historical',
    'tournament'
);

-- Game status
CREATE TYPE game_status AS ENUM (
    'waiting',
    'setup',
    'playing',
    'paused',
    'finished',
    'abandoned'
);

-- Move result types
CREATE TYPE move_result AS ENUM (
    'miss',
    'hit',
    'sunk',
    'critical_hit',
    'near_miss'
);

-- Power-up types
CREATE TYPE powerup_type AS ENUM (
    'radar_scan',
    'barrage',
    'sonar_ping',
    'smoke_screen',
    'repair_kit',
    'torpedo_salvo',
    'air_strike'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table with enhanced profile
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    country_code VARCHAR(2),
    preferred_language VARCHAR(5) DEFAULT 'en',

    -- Game statistics
    rating INTEGER DEFAULT 1200,
    peak_rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    total_shots_fired INTEGER DEFAULT 0,
    total_hits INTEGER DEFAULT 0,
    ships_sunk INTEGER DEFAULT 0,
    perfect_games INTEGER DEFAULT 0,

    -- Achievements and progression
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements JSONB DEFAULT '[]'::jsonb,
    unlocked_ships JSONB DEFAULT '[]'::jsonb,

    -- Account metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT false,
    is_ai BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    banned_until TIMESTAMP WITH TIME ZONE,

    CONSTRAINT rating_check CHECK (rating >= 0),
    CONSTRAINT level_check CHECK (level >= 1)
);

-- Historical ship types table
CREATE TABLE IF NOT EXISTS ship_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    class ship_class NOT NULL,
    era ship_era NOT NULL,
    size INTEGER NOT NULL,

    -- Historical information
    country_of_origin VARCHAR(100),
    year_introduced INTEGER,
    year_retired INTEGER,
    displacement_tons INTEGER,
    length_meters DECIMAL(6,2),
    beam_meters DECIMAL(5,2),
    draft_meters DECIMAL(4,2),
    max_speed_knots DECIMAL(4,1),
    crew_size INTEGER,

    -- Game mechanics
    hit_points INTEGER NOT NULL,
    armor_rating INTEGER DEFAULT 0,
    firepower_rating INTEGER DEFAULT 0,
    maneuverability INTEGER DEFAULT 0,
    detection_range INTEGER DEFAULT 3,
    special_abilities JSONB DEFAULT '[]'::jsonb,

    -- Visual and descriptive
    description TEXT,
    historical_notes TEXT,
    image_url TEXT,
    model_3d_url TEXT,

    -- Availability
    is_premium BOOLEAN DEFAULT false,
    unlock_level INTEGER DEFAULT 1,
    unlock_cost INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Games table with enhanced features
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) UNIQUE,

    -- Players
    player1_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Game configuration
    game_mode game_mode NOT NULL DEFAULT 'classic',
    board_width INTEGER NOT NULL DEFAULT 10,
    board_height INTEGER NOT NULL DEFAULT 10,
    ship_set_id UUID,
    time_limit INTEGER, -- seconds per turn
    max_game_time INTEGER, -- total game time limit in seconds

    -- Game state
    status game_status NOT NULL DEFAULT 'waiting',
    game_state JSONB NOT NULL DEFAULT '{}',
    current_turn UUID,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    turn_count INTEGER DEFAULT 0,

    -- Rating changes
    player1_rating_change INTEGER,
    player2_rating_change INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    is_ranked BOOLEAN DEFAULT false,
    is_tournament BOOLEAN DEFAULT false,
    tournament_id UUID,
    replay_data JSONB,

    CONSTRAINT valid_board_size CHECK (board_width >= 8 AND board_width <= 20 AND board_height >= 8 AND board_height <= 20)
);

-- Ship placements with enhanced tracking
CREATE TABLE IF NOT EXISTS ship_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_type_id UUID NOT NULL REFERENCES ship_types(id),

    -- Position and orientation
    positions JSONB NOT NULL, -- Array of {x, y} coordinates
    orientation VARCHAR(10) NOT NULL CHECK (orientation IN ('horizontal', 'vertical')),

    -- Damage tracking
    is_sunk BOOLEAN DEFAULT false,
    hits INTEGER DEFAULT 0,
    critical_hits INTEGER DEFAULT 0,
    damage_sections JSONB DEFAULT '[]'::jsonb, -- Which sections are damaged

    -- Power-ups and abilities
    abilities_used JSONB DEFAULT '[]'::jsonb,
    last_ability_turn INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(game_id, player_id, ship_type_id)
);

-- Game moves with enhanced data
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,

    -- Move details
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    result move_result NOT NULL,
    ship_type_id UUID REFERENCES ship_types(id),
    damage_dealt INTEGER DEFAULT 0,

    -- Special moves
    is_special_move BOOLEAN DEFAULT false,
    powerup_used powerup_type,
    affected_cells JSONB, -- For area effects

    -- Timing and performance
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER, -- milliseconds to make the move
    think_time INTEGER, -- time spent before clicking

    UNIQUE(game_id, move_number),
    CONSTRAINT valid_coordinates CHECK (x >= 0 AND y >= 0)
);

-- Chat messages with reactions
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    lobby_id UUID,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For private messages

    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',

    -- Reactions
    reactions JSONB DEFAULT '{}'::jsonb, -- {emoji: [user_ids]}
    is_system_message BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT message_location CHECK (
        (game_id IS NOT NULL AND lobby_id IS NULL) OR
        (game_id IS NULL AND lobby_id IS NOT NULL) OR
        (recipient_id IS NOT NULL)
    )
);

-- =============================================
-- FEATURE TABLES
-- =============================================

-- Ship sets for different game modes
CREATE TABLE IF NOT EXISTS ship_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    era ship_era,

    -- Ships in this set
    ships JSONB NOT NULL, -- Array of {ship_type_id, count}

    -- Requirements
    min_board_size INTEGER DEFAULT 10,
    recommended_board_size INTEGER DEFAULT 10,

    -- Availability
    is_default BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    unlock_level INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament management
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Tournament configuration
    format VARCHAR(50) NOT NULL, -- 'single_elimination', 'double_elimination', 'round_robin', 'swiss'
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,

    -- Rules
    game_mode game_mode NOT NULL,
    ship_set_id UUID REFERENCES ship_sets(id),
    time_limit INTEGER,
    board_size INTEGER DEFAULT 10,

    -- Schedule
    registration_starts TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_ends TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_starts TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_ends TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'registration', 'in_progress', 'completed', 'cancelled'
    current_round INTEGER DEFAULT 0,

    -- Prizes
    prize_pool JSONB DEFAULT '{}'::jsonb,
    entry_fee INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Progress
    current_round INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,

    -- Ranking
    seed INTEGER,
    final_position INTEGER,
    prize_won JSONB,

    -- Status
    is_eliminated BOOLEAN DEFAULT false,
    withdrew_at TIMESTAMP WITH TIME ZONE,

    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tournament_id, user_id)
);

-- Friends and social features
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    initiated_by UUID NOT NULL REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user1_id, user2_id),
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    CONSTRAINT ordered_users CHECK (user1_id < user2_id) -- Ensure unique pairs
);

-- Player achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Achievement details
    category VARCHAR(50) NOT NULL, -- 'combat', 'social', 'progression', 'special'
    points INTEGER DEFAULT 10,
    icon_url TEXT,

    -- Requirements
    requirement_type VARCHAR(50) NOT NULL, -- 'games_won', 'ships_sunk', 'perfect_games', etc.
    requirement_value INTEGER NOT NULL,
    requirement_details JSONB,

    -- Rarity
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'

    -- Stats
    times_earned INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements earned
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,

    UNIQUE(user_id, achievement_id)
);

-- Game replays for analysis
CREATE TABLE IF NOT EXISTS game_replays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    -- Replay data
    version INTEGER DEFAULT 1,
    events JSONB NOT NULL, -- Complete game event log
    initial_state JSONB NOT NULL,
    final_state JSONB NOT NULL,

    -- Metadata
    duration_seconds INTEGER,
    total_moves INTEGER,

    -- Analysis
    interesting_moments JSONB, -- Timestamps of key moments
    player1_accuracy DECIMAL(5,2),
    player2_accuracy DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(game_id)
);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE NOT NULL UNIQUE,

    -- Challenge configuration
    name VARCHAR(200) NOT NULL,
    description TEXT,
    board_config JSONB NOT NULL, -- Pre-placed enemy ships
    ship_set_id UUID REFERENCES ship_sets(id),

    -- Objectives
    primary_objective JSONB NOT NULL, -- e.g., "sink all ships in X moves"
    bonus_objectives JSONB DEFAULT '[]'::jsonb,

    -- Rewards
    base_reward INTEGER DEFAULT 100,
    bonus_rewards JSONB DEFAULT '{}'::jsonb,

    -- Stats
    attempts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    perfect_completions INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User challenge attempts
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,

    -- Attempt details
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    best_score INTEGER,
    moves_used INTEGER,
    time_taken INTEGER, -- seconds

    -- Objectives completed
    objectives_completed JSONB DEFAULT '[]'::jsonb,
    rewards_earned JSONB DEFAULT '{}'::jsonb,

    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, challenge_id)
);

-- =============================================
-- STATISTICS AND ANALYTICS TABLES
-- =============================================

-- Player statistics by ship type
CREATE TABLE IF NOT EXISTS player_ship_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_type_id UUID NOT NULL REFERENCES ship_types(id),

    times_used INTEGER DEFAULT 0,
    times_sunk INTEGER DEFAULT 0,
    total_hits_taken INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    survival_rate DECIMAL(5,2),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, ship_type_id)
);

-- Session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,

    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,

    games_played INTEGER DEFAULT 0,
    chat_messages_sent INTEGER DEFAULT 0
);

-- =============================================
-- VIEWS
-- =============================================

-- Enhanced leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.country_code,
    u.rating,
    u.peak_rating,
    u.level,
    u.games_played,
    u.games_won,
    u.games_drawn,
    CASE
        WHEN u.games_played > 0
        THEN ROUND((u.games_won::NUMERIC / u.games_played) * 100, 2)
        ELSE 0
    END as win_rate,
    CASE
        WHEN u.total_shots_fired > 0
        THEN ROUND((u.total_hits::NUMERIC / u.total_shots_fired) * 100, 2)
        ELSE 0
    END as accuracy,
    u.ships_sunk,
    u.perfect_games,
    u.is_online,
    u.last_active,
    RANK() OVER (ORDER BY u.rating DESC) as global_rank,
    RANK() OVER (PARTITION BY u.country_code ORDER BY u.rating DESC) as country_rank
FROM users u
WHERE u.games_played >= 5
    AND u.banned_until IS NULL OR u.banned_until < CURRENT_TIMESTAMP
    AND NOT u.is_ai
ORDER BY u.rating DESC;

-- Active games view
CREATE OR REPLACE VIEW active_games AS
SELECT
    g.*,
    p1.username as player1_username,
    p1.display_name as player1_display_name,
    p1.rating as player1_rating,
    p2.username as player2_username,
    p2.display_name as player2_display_name,
    p2.rating as player2_rating,
    CASE
        WHEN g.current_turn = g.player1_id THEN p1.username
        WHEN g.current_turn = g.player2_id THEN p2.username
        ELSE NULL
    END as current_player_username,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - g.last_action_at)) as seconds_since_last_action
FROM games g
LEFT JOIN users p1 ON g.player1_id = p1.id
LEFT JOIN users p2 ON g.player2_id = p2.id
WHERE g.status IN ('waiting', 'setup', 'playing', 'paused');

-- Tournament standings view
CREATE OR REPLACE VIEW tournament_standings AS
SELECT
    tp.*,
    u.username,
    u.display_name,
    u.avatar_url,
    u.rating,
    t.name as tournament_name,
    (tp.wins * 3 + tp.draws) as points,
    RANK() OVER (PARTITION BY tp.tournament_id ORDER BY (tp.wins * 3 + tp.draws) DESC, tp.wins DESC) as current_rank
FROM tournament_participants tp
JOIN users u ON tp.user_id = u.id
JOIN tournaments t ON tp.tournament_id = t.id
WHERE NOT tp.is_eliminated
ORDER BY tp.tournament_id, points DESC;

-- =============================================
-- INDEXES
-- =============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code);

-- Game indexes
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id) WHERE tournament_id IS NOT NULL;

-- Ship placement indexes
CREATE INDEX IF NOT EXISTS idx_ship_placements_game ON ship_placements(game_id);
CREATE INDEX IF NOT EXISTS idx_ship_placements_player ON ship_placements(player_id);

-- Game moves indexes
CREATE INDEX IF NOT EXISTS idx_game_moves_game ON game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_player ON game_moves(player_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_timestamp ON game_moves(timestamp DESC);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON chat_messages(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Tournament indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts ON tournaments(tournament_starts);

-- Friendship indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Achievement indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON user_sessions(last_activity DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || COALESCE(display_name, '')));
CREATE INDEX IF NOT EXISTS idx_ship_types_search ON ship_types USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ship_types_updated_at BEFORE UPDATE ON ship_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ship_sets_updated_at BEFORE UPDATE ON ship_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user statistics trigger
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
        -- Update games played
        UPDATE users SET games_played = games_played + 1
        WHERE id IN (NEW.player1_id, NEW.player2_id);

        -- Update games won
        IF NEW.winner_id IS NOT NULL THEN
            UPDATE users SET games_won = games_won + 1
            WHERE id = NEW.winner_id;
        ELSE
            -- Draw
            UPDATE users SET games_drawn = games_drawn + 1
            WHERE id IN (NEW.player1_id, NEW.player2_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_on_game_finish
    AFTER UPDATE OF status ON games
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- =============================================
-- PERMISSIONS
-- =============================================

-- Grant permissions for Electric SQL user
GRANT ALL PRIVILEGES ON SCHEMA battleship TO electric;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA battleship TO electric;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA battleship TO electric;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA battleship TO electric;

-- Set replica identity for Electric SQL
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE ship_types REPLICA IDENTITY FULL;
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE ship_placements REPLICA IDENTITY FULL;
ALTER TABLE game_moves REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE ship_sets REPLICA IDENTITY FULL;
ALTER TABLE tournaments REPLICA IDENTITY FULL;
ALTER TABLE tournament_participants REPLICA IDENTITY FULL;
ALTER TABLE friendships REPLICA IDENTITY FULL;
ALTER TABLE achievements REPLICA IDENTITY FULL;
ALTER TABLE user_achievements REPLICA IDENTITY FULL;
ALTER TABLE game_replays REPLICA IDENTITY FULL;
ALTER TABLE daily_challenges REPLICA IDENTITY FULL;
ALTER TABLE user_challenges REPLICA IDENTITY FULL;
ALTER TABLE player_ship_stats REPLICA IDENTITY FULL;
ALTER TABLE user_sessions REPLICA IDENTITY FULL;