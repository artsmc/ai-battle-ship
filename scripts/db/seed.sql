-- Seed data for Battleship Naval Strategy Game
-- Development and testing data

SET search_path TO battleship, public;

-- Clear existing data (be careful in production!)
TRUNCATE TABLE chat_messages, game_moves, ship_placements, games, users CASCADE;

-- Insert test users
INSERT INTO users (id, username, email, password_hash, display_name, rating, games_played, games_won) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admiral_nelson', 'nelson@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'Admiral Nelson', 1450, 50, 35),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'captain_hook', 'hook@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'Captain Hook', 1380, 45, 28),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'commander_jane', 'jane@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'Commander Jane', 1520, 60, 42),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'lieutenant_bob', 'bob@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'Lt. Bob', 1200, 20, 8),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ai_opponent', 'ai@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'AI Opponent', 1300, 100, 50),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'test_player', 'test@battleship.test', '$2b$10$YKxQZmW.OzL8nXV5xKXXXeW3WcPxQzX5OyQZmW.OzL8nXV5xKXXXe', 'Test Player', 1200, 0, 0);

-- Insert sample games (various states)
INSERT INTO games (id, room_code, player1_id, player2_id, game_mode, status, current_turn, winner_id, turn_count, created_at, started_at, finished_at) VALUES
    -- Finished game
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'GAME001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'classic', 'finished', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 45, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),

    -- Game in progress
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'GAME002', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'classic', 'playing', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NULL, 12, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '50 minutes', NULL),

    -- Game in setup phase
    ('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'GAME003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'advanced', 'setup', NULL, NULL, 0, NOW() - INTERVAL '10 minutes', NULL, NULL),

    -- Waiting for player
    ('40eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'GAME004', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NULL, 'classic', 'waiting', NULL, NULL, 0, NOW() - INTERVAL '5 minutes', NULL, NULL),

    -- AI game
    ('50eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'GAME005', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'classic', 'setup', NULL, NULL, 0, NOW() - INTERVAL '2 minutes', NULL, NULL);

-- Insert ship placements for the game in progress
INSERT INTO ship_placements (game_id, player_id, ship_type, positions, is_sunk, hits) VALUES
    -- Player 1 ships
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'carrier', '[{"x": 0, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y": 2}, {"x": 0, "y": 3}, {"x": 0, "y": 4}]', false, 2),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'battleship', '[{"x": 2, "y": 2}, {"x": 3, "y": 2}, {"x": 4, "y": 2}, {"x": 5, "y": 2}]', false, 1),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'cruiser', '[{"x": 7, "y": 5}, {"x": 7, "y": 6}, {"x": 7, "y": 7}]', false, 0),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'submarine', '[{"x": 4, "y": 8}, {"x": 5, "y": 8}, {"x": 6, "y": 8}]', true, 3),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'destroyer', '[{"x": 9, "y": 1}, {"x": 9, "y": 2}]', false, 0),

    -- Player 2 ships
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'carrier', '[{"x": 1, "y": 3}, {"x": 2, "y": 3}, {"x": 3, "y": 3}, {"x": 4, "y": 3}, {"x": 5, "y": 3}]', false, 0),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'battleship', '[{"x": 6, "y": 6}, {"x": 6, "y": 7}, {"x": 6, "y": 8}, {"x": 6, "y": 9}]', false, 2),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'cruiser', '[{"x": 0, "y": 9}, {"x": 1, "y": 9}, {"x": 2, "y": 9}]', false, 1),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'submarine', '[{"x": 8, "y": 0}, {"x": 8, "y": 1}, {"x": 8, "y": 2}]', false, 0),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'destroyer', '[{"x": 3, "y": 5}, {"x": 3, "y": 6}]', true, 2);

-- Insert some game moves for the game in progress
INSERT INTO game_moves (game_id, player_id, move_number, x, y, result, ship_type, response_time) VALUES
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 1, 6, 6, 'hit', 'battleship', 5230),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 2, 0, 0, 'hit', 'carrier', 3420),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 3, 6, 7, 'hit', 'battleship', 2150),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 4, 0, 1, 'hit', 'carrier', 4320),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 5, 1, 9, 'hit', 'cruiser', 3210),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 6, 2, 2, 'hit', 'battleship', 2890),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 7, 3, 5, 'hit', 'destroyer', 1980),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 8, 4, 8, 'hit', 'submarine', 3670),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 9, 3, 6, 'sunk', 'destroyer', 2340),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 10, 5, 8, 'hit', 'submarine', 4120),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 11, 5, 5, 'miss', NULL, 1890),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 12, 6, 8, 'sunk', 'submarine', 3450);

-- Insert chat messages
INSERT INTO chat_messages (game_id, sender_id, message, message_type) VALUES
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Good luck!', 'text'),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'You too!', 'text'),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Nice shot!', 'text'),
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Thanks! Got your submarine!', 'text');

-- Update game state for the in-progress game
UPDATE games
SET game_state = '{
    "board_size": 10,
    "turn_timer": 30,
    "ships_remaining": {
        "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13": 4,
        "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14": 4
    },
    "last_shot": {
        "player": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
        "x": 6,
        "y": 8,
        "result": "sunk"
    }
}'::jsonb
WHERE id = '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

-- Create some statistics
UPDATE users
SET is_online = true, last_active = NOW()
WHERE id IN ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16');

-- Output summary
SELECT 'Database seeded successfully!' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as game_count FROM games;
SELECT COUNT(*) as active_games FROM games WHERE status IN ('setup', 'playing', 'waiting');