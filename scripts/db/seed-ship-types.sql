-- Historical Ship Types Seed Data
-- Comprehensive collection of naval vessels from different eras

SET search_path TO battleship, public;

-- Clear existing ship types (for development)
TRUNCATE TABLE ship_types CASCADE;

-- =============================================
-- PRE-DREADNOUGHT ERA (1890-1906)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- Royal Navy Pre-Dreadnoughts
('HMS Royal Sovereign', 'battleship', 'pre_dreadnought', 5, 'United Kingdom', 1892, 1913,
    14150, 125.0, 22.9, 8.4, 17.5, 712,
    50, 7, 8, 2, 3,
    'Royal Sovereign-class battleship, backbone of the Victorian Royal Navy',
    'First-class battleships that served as the model for battleship design worldwide in the 1890s',
    false, 5),

('HMS Majestic', 'battleship', 'pre_dreadnought', 5, 'United Kingdom', 1895, 1915,
    16060, 128.6, 22.9, 8.2, 17.0, 672,
    52, 8, 8, 2, 3,
    'Majestic-class battleship, the largest class of battleships ever built',
    'Nine ships of this class formed the core of the Channel Fleet',
    false, 6),

-- US Navy Pre-Dreadnoughts
('USS Maine', 'battleship', 'pre_dreadnought', 4, 'United States', 1895, 1898,
    6682, 98.9, 17.4, 6.7, 17.0, 374,
    40, 5, 6, 3, 3,
    'Second-class battleship whose destruction sparked the Spanish-American War',
    'Sunk in Havana Harbor on February 15, 1898, "Remember the Maine!"',
    true, 4),

('USS Indiana', 'battleship', 'pre_dreadnought', 5, 'United States', 1895, 1919,
    10288, 107.7, 21.1, 7.3, 15.0, 473,
    45, 7, 7, 2, 3,
    'Indiana-class battleship, first American battleships comparable to foreign designs',
    'Fought in the Battle of Santiago de Cuba during the Spanish-American War',
    false, 5),

-- German Pre-Dreadnoughts
('SMS Kaiser Friedrich III', 'battleship', 'pre_dreadnought', 5, 'Germany', 1898, 1920,
    11785, 125.3, 20.4, 8.0, 18.0, 651,
    48, 7, 7, 3, 3,
    'Kaiser Friedrich III-class battleship of the Imperial German Navy',
    'First class of German battleships built under the naval expansion program',
    false, 5),

-- French Pre-Dreadnoughts
('Charlemagne', 'battleship', 'pre_dreadnought', 5, 'France', 1897, 1920,
    11275, 117.8, 20.3, 8.4, 18.0, 694,
    46, 6, 7, 2, 3,
    'Charlemagne-class battleship of the French Navy',
    'Three ships served in the Mediterranean during World War I',
    false, 5),

-- =============================================
-- DREADNOUGHT ERA (1906-1920)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- The Original Dreadnought
('HMS Dreadnought', 'battleship', 'dreadnought', 5, 'United Kingdom', 1906, 1921,
    18110, 160.6, 25.0, 9.0, 21.0, 773,
    60, 9, 10, 3, 4,
    'The revolutionary all-big-gun battleship that made all others obsolete',
    'First battleship with uniform main battery and steam turbine propulsion',
    true, 8),

-- Royal Navy Dreadnoughts
('HMS Iron Duke', 'battleship', 'dreadnought', 5, 'United Kingdom', 1914, 1946,
    25000, 189.8, 27.4, 9.0, 21.0, 1022,
    65, 10, 11, 3, 4,
    'Iron Duke-class super-dreadnought, flagship at the Battle of Jutland',
    'Admiral Jellicoe''s flagship, fired over 90 rounds at Jutland',
    false, 10),

('HMS Queen Elizabeth', 'battleship', 'super_dreadnought', 5, 'United Kingdom', 1915, 1948,
    27500, 196.8, 27.6, 10.0, 24.0, 1025,
    70, 11, 12, 3, 4,
    'Queen Elizabeth-class fast battleship, first oil-fired capital ships',
    'Served in both World Wars, underwent major reconstruction in the 1930s',
    true, 12),

-- US Navy Dreadnoughts
('USS Texas', 'battleship', 'dreadnought', 5, 'United States', 1914, 1948,
    27000, 174.7, 29.0, 8.7, 21.0, 1053,
    64, 10, 11, 3, 4,
    'New York-class battleship, last US battleship with reciprocating engines',
    'Only surviving dreadnought battleship, now a museum ship in Texas',
    false, 9),

('USS Arizona', 'battleship', 'super_dreadnought', 5, 'United States', 1916, 1941,
    29158, 185.3, 29.6, 9.3, 21.0, 1385,
    68, 10, 11, 3, 4,
    'Pennsylvania-class battleship, lost at Pearl Harbor',
    'Sunk December 7, 1941, now a memorial at Pearl Harbor',
    true, 11),

-- German Dreadnoughts
('SMS Nassau', 'battleship', 'dreadnought', 5, 'Germany', 1909, 1920,
    18873, 146.1, 26.9, 8.8, 19.0, 1008,
    58, 9, 9, 3, 4,
    'Nassau-class battleship, Germany''s first dreadnoughts',
    'Fought at the Battle of Jutland, rammed HMS Spitfire',
    false, 8),

('SMS König', 'battleship', 'dreadnought', 5, 'Germany', 1914, 1919,
    25796, 175.4, 29.5, 9.3, 21.0, 1136,
    66, 10, 11, 3, 4,
    'König-class battleship of the Imperial German Navy',
    'Participated in Battle of Jutland, scuttled at Scapa Flow',
    false, 10),

-- =============================================
-- BATTLECRUISER ERA (1908-1945)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- British Battlecruisers
('HMS Invincible', 'battlecruiser', 'battlecruiser', 5, 'United Kingdom', 1908, 1916,
    17373, 172.8, 24.4, 8.0, 25.5, 1032,
    55, 6, 10, 4, 5,
    'Invincible-class battlecruiser, first of the type',
    'Lost at Jutland with near total loss of crew after magazine explosion',
    true, 9),

('HMS Hood', 'battlecruiser', 'battlecruiser', 5, 'United Kingdom', 1920, 1941,
    46680, 262.0, 31.8, 10.1, 31.0, 1418,
    75, 8, 13, 4, 5,
    'Admiral-class battlecruiser, "The Mighty Hood"',
    'Largest warship in the world for 20 years, sunk by Bismarck',
    true, 15),

-- German Battlecruisers
('SMS Von der Tann', 'battlecruiser', 'battlecruiser', 5, 'Germany', 1910, 1919,
    19370, 171.7, 26.6, 9.2, 24.8, 1174,
    56, 7, 9, 4, 5,
    'Germany''s first battlecruiser',
    'Sank HMS Indefatigable at Jutland, scuttled at Scapa Flow',
    false, 9),

('SMS Derfflinger', 'battlecruiser', 'battlecruiser', 5, 'Germany', 1914, 1919,
    26600, 210.4, 29.0, 9.2, 26.5, 1112,
    62, 8, 11, 4, 5,
    'Derfflinger-class battlecruiser, "Iron Dog"',
    'Survived heavy damage at Jutland, scuttled at Scapa Flow',
    false, 11),

-- =============================================
-- SUPER-DREADNOUGHT ERA (1920-1945)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- Treaty Battleships
('HMS Nelson', 'battleship', 'super_dreadnought', 5, 'United Kingdom', 1927, 1949,
    34000, 216.4, 32.3, 10.2, 23.0, 1361,
    72, 12, 13, 2, 4,
    'Nelson-class battleship, unique all-forward main armament',
    'Treaty battleship with 16-inch guns, served throughout WWII',
    false, 13),

('USS North Carolina', 'battleship', 'super_dreadnought', 5, 'United States', 1941, 1961,
    35000, 222.1, 33.0, 10.0, 28.0, 1880,
    75, 11, 13, 3, 5,
    'North Carolina-class fast battleship',
    'First US fast battleships, earned 15 battle stars in WWII',
    false, 14),

-- The Big Guns
('Yamato', 'battleship', 'super_dreadnought', 6, 'Japan', 1941, 1945,
    65027, 263.0, 38.9, 10.4, 27.0, 2767,
    85, 14, 15, 2, 5,
    'Yamato-class super-battleship, largest battleships ever built',
    'Carried the largest naval guns ever mounted (46cm/18.1 inch)',
    true, 18),

('Bismarck', 'battleship', 'super_dreadnought', 5, 'Germany', 1940, 1941,
    41700, 251.0, 36.0, 9.3, 30.0, 2092,
    78, 12, 14, 3, 5,
    'Bismarck-class battleship, pride of the Kriegsmarine',
    'Sank HMS Hood, hunted down and sunk in May 1941',
    true, 16),

('USS Iowa', 'battleship', 'super_dreadnought', 5, 'United States', 1943, 1990,
    45000, 270.4, 33.0, 11.0, 33.0, 1921,
    80, 12, 14, 4, 5,
    'Iowa-class fast battleship, last battleships built by the US',
    'Served in WWII, Korea, and Gulf War. Four ships are now museums',
    true, 17),

('Richelieu', 'battleship', 'super_dreadnought', 5, 'France', 1940, 1967,
    38500, 247.9, 33.1, 9.9, 30.0, 1670,
    74, 11, 13, 3, 5,
    'Richelieu-class battleship with unique quad turrets',
    'Fought for both Vichy France and Free France in WWII',
    false, 15),

-- =============================================
-- CRUISERS AND SMALLER VESSELS
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- Heavy Cruisers
('Admiral Hipper', 'heavy_cruiser', 'super_dreadnought', 4, 'Germany', 1939, 1945,
    14050, 202.8, 21.3, 7.2, 32.0, 1382,
    40, 6, 8, 5, 4,
    'Admiral Hipper-class heavy cruiser',
    'Successful commerce raider, sank multiple merchant vessels',
    false, 7),

('USS Baltimore', 'heavy_cruiser', 'super_dreadnought', 4, 'United States', 1943, 1971,
    13600, 205.3, 21.6, 7.3, 33.0, 1142,
    42, 5, 8, 5, 4,
    'Baltimore-class heavy cruiser, backbone of the US cruiser force',
    'Fourteen ships built, served in WWII, Korea, and Vietnam',
    false, 8),

-- Light Cruisers
('HMS Belfast', 'light_cruiser', 'super_dreadnought', 3, 'United Kingdom', 1939, 1963,
    11550, 187.0, 19.3, 6.0, 32.0, 781,
    35, 4, 6, 6, 4,
    'Town-class light cruiser, now a museum ship in London',
    'Participated in the Battle of North Cape and D-Day',
    false, 6),

('USS Atlanta', 'light_cruiser', 'super_dreadnought', 3, 'United States', 1941, 1949,
    6718, 164.9, 16.2, 6.3, 33.0, 673,
    30, 3, 7, 7, 4,
    'Atlanta-class anti-aircraft cruiser',
    'Designed for fleet air defense with 16 5-inch guns',
    false, 5),

-- Destroyers
('Fletcher', 'destroyer', 'super_dreadnought', 2, 'United States', 1942, 1969,
    2050, 114.7, 12.1, 5.3, 36.5, 329,
    20, 2, 4, 8, 3,
    'Fletcher-class destroyer, most successful destroyer class',
    '175 ships built, served throughout the Pacific War',
    false, 3),

('Z-23', 'destroyer', 'super_dreadnought', 2, 'Germany', 1940, 1945,
    2603, 127.0, 12.0, 4.6, 36.0, 321,
    22, 2, 5, 8, 3,
    'Type 1936A destroyer of the Kriegsmarine',
    'Large destroyers with 15cm guns instead of standard 12.7cm',
    false, 4),

('Akizuki', 'destroyer', 'super_dreadnought', 2, 'Japan', 1942, 1945,
    2701, 134.2, 11.6, 4.2, 33.0, 300,
    21, 2, 5, 8, 3,
    'Akizuki-class destroyer, designed for fleet air defense',
    'Among the best AA destroyers of WWII',
    false, 4),

-- Submarines
('Type VII U-Boat', 'submarine', 'super_dreadnought', 3, 'Germany', 1936, 1945,
    769, 67.1, 6.2, 4.7, 17.7, 44,
    25, 1, 6, 6, 2,
    'Most produced submarine type in history',
    'Over 700 built, backbone of the Battle of the Atlantic',
    false, 5),

('Gato', 'submarine', 'super_dreadnought', 3, 'United States', 1941, 1969,
    1549, 95.0, 8.3, 5.2, 21.0, 60,
    28, 1, 6, 6, 2,
    'Gato-class fleet submarine',
    'Devastated Japanese shipping in the Pacific War',
    false, 5),

-- =============================================
-- MODERN ERA (1945-Present)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

-- Modern Carriers
('USS Nimitz', 'carrier', 'modern', 6, 'United States', 1975, NULL,
    100000, 332.8, 76.8, 11.3, 31.5, 5680,
    90, 8, 10, 2, 6,
    'Nimitz-class nuclear-powered supercarrier',
    'Largest warships in the world, 10 ships in class',
    true, 20),

-- Modern Destroyers
('Arleigh Burke', 'destroyer', 'modern', 3, 'United States', 1991, NULL,
    8315, 154.0, 20.0, 9.3, 30.0, 323,
    35, 4, 9, 7, 5,
    'Arleigh Burke-class guided missile destroyer',
    'Most numerous destroyer class in US Navy since WWII',
    false, 10),

('Type 45', 'destroyer', 'modern', 3, 'United Kingdom', 2009, NULL,
    8500, 152.4, 21.2, 7.4, 30.0, 191,
    36, 4, 9, 7, 6,
    'Daring-class air-defence destroyer',
    'Most advanced air defense destroyers in the Royal Navy',
    false, 11),

-- Modern Frigates
('Oliver Hazard Perry', 'frigate', 'modern', 2, 'United States', 1977, 2015,
    4100, 138.0, 14.3, 6.7, 29.0, 176,
    25, 3, 6, 8, 4,
    'Perry-class guided missile frigate',
    'Built in large numbers for the US and allied navies',
    false, 6),

-- Modern Submarines
('Los Angeles', 'submarine', 'modern', 3, 'United States', 1976, NULL,
    6927, 110.3, 10.1, 9.4, 25.0, 129,
    35, 2, 8, 7, 3,
    'Los Angeles-class nuclear attack submarine',
    '62 boats built, most numerous nuclear submarine class',
    false, 8),

('Virginia', 'submarine', 'modern', 3, 'United States', 2004, NULL,
    7900, 115.0, 10.4, 9.3, 34.0, 135,
    38, 2, 9, 8, 3,
    'Virginia-class nuclear attack submarine',
    'Latest generation US attack submarine',
    true, 12),

-- =============================================
-- CLASSIC GAME SHIPS (Simplified for gameplay)
-- =============================================

INSERT INTO ship_types (name, class, era, size, country_of_origin, year_introduced, year_retired,
    displacement_tons, length_meters, beam_meters, draft_meters, max_speed_knots, crew_size,
    hit_points, armor_rating, firepower_rating, maneuverability, detection_range,
    description, historical_notes, is_premium, unlock_level) VALUES

('Carrier', 'carrier', 'fictional', 5, 'Generic', NULL, NULL,
    50000, 250.0, 40.0, 10.0, 30.0, 2000,
    50, 5, 3, 2, 5,
    'Standard aircraft carrier for classic gameplay',
    'The largest and most valuable ship in the classic game',
    false, 1),

('Battleship', 'battleship', 'fictional', 4, 'Generic', NULL, NULL,
    35000, 200.0, 30.0, 9.0, 28.0, 1500,
    40, 7, 8, 3, 4,
    'Standard battleship for classic gameplay',
    'Heavy armor and firepower make this a formidable opponent',
    false, 1),

('Cruiser', 'light_cruiser', 'fictional', 3, 'Generic', NULL, NULL,
    10000, 150.0, 18.0, 7.0, 32.0, 700,
    30, 4, 6, 5, 4,
    'Standard cruiser for classic gameplay',
    'Balanced speed and firepower',
    false, 1),

('Submarine', 'submarine', 'fictional', 3, 'Generic', NULL, NULL,
    2000, 70.0, 7.0, 5.0, 20.0, 50,
    30, 2, 5, 6, 2,
    'Standard submarine for classic gameplay',
    'Stealthy but vulnerable when found',
    false, 1),

('Destroyer', 'destroyer', 'fictional', 2, 'Generic', NULL, NULL,
    3000, 100.0, 11.0, 5.0, 35.0, 300,
    20, 2, 4, 8, 3,
    'Standard destroyer for classic gameplay',
    'Fast and maneuverable but lightly armored',
    false, 1);

-- Create ship sets
INSERT INTO ship_sets (name, description, era, ships, min_board_size, recommended_board_size, is_default, is_premium, unlock_level) VALUES

('Classic Fleet', 'Traditional Battleship game fleet', 'fictional',
    '[{"ship_type_name": "Carrier", "count": 1}, {"ship_type_name": "Battleship", "count": 1}, {"ship_type_name": "Cruiser", "count": 1}, {"ship_type_name": "Submarine", "count": 1}, {"ship_type_name": "Destroyer", "count": 1}]'::jsonb,
    10, 10, true, false, 1),

('WWII Pacific Fleet', 'US Navy Task Force from the Pacific War', 'super_dreadnought',
    '[{"ship_type_name": "USS Iowa", "count": 1}, {"ship_type_name": "USS Baltimore", "count": 2}, {"ship_type_name": "USS Atlanta", "count": 2}, {"ship_type_name": "Fletcher", "count": 3}, {"ship_type_name": "Gato", "count": 2}]'::jsonb,
    12, 14, false, true, 15),

('Royal Navy Grand Fleet', 'British fleet from the Battle of Jutland', 'dreadnought',
    '[{"ship_type_name": "HMS Iron Duke", "count": 1}, {"ship_type_name": "HMS Queen Elizabeth", "count": 1}, {"ship_type_name": "HMS Invincible", "count": 1}, {"ship_type_name": "HMS Belfast", "count": 2}]'::jsonb,
    12, 12, false, false, 10),

('Kriegsmarine Wolf Pack', 'German naval force from WWII', 'super_dreadnought',
    '[{"ship_type_name": "Bismarck", "count": 1}, {"ship_type_name": "Admiral Hipper", "count": 2}, {"ship_type_name": "Z-23", "count": 3}, {"ship_type_name": "Type VII U-Boat", "count": 4}]'::jsonb,
    12, 14, false, true, 16),

('Pre-Dreadnought Squadron', 'Turn of the century naval force', 'pre_dreadnought',
    '[{"ship_type_name": "HMS Royal Sovereign", "count": 1}, {"ship_type_name": "HMS Majestic", "count": 1}, {"ship_type_name": "USS Indiana", "count": 1}]'::jsonb,
    10, 10, false, false, 6),

('Modern Task Force', 'Contemporary naval battle group', 'modern',
    '[{"ship_type_name": "Arleigh Burke", "count": 3}, {"ship_type_name": "Virginia", "count": 2}, {"ship_type_name": "Oliver Hazard Perry", "count": 2}]'::jsonb,
    12, 12, false, true, 18);

-- Output summary
SELECT 'Ship types seeded successfully!' as message;
SELECT COUNT(*) as ship_type_count FROM ship_types;
SELECT era, COUNT(*) as count FROM ship_types GROUP BY era ORDER BY era;
SELECT COUNT(*) as ship_set_count FROM ship_sets;