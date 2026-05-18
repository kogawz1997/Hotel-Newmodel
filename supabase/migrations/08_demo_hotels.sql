-- =============================================================================
-- Migration: 08_demo_hotels.sql
-- Description: Demo data for Maitri Collection Group — 5 Thai luxury hotels
-- Idempotent: uses ON CONFLICT DO NOTHING with hardcoded UUIDs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORGANIZATION
-- -----------------------------------------------------------------------------

INSERT INTO organizations (id, name, slug, subscription_plan, subscription_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Collection Group',
    'maitri-collection',
    'enterprise',
    'active'
)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 1: Maitri Collection Bangkok
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Collection Bangkok',
    'maitri-bangkok',
    'hotel',
    '28 Silom Road, Silom, Bangrak',
    'Bangkok',
    'Thailand',
    '+66-2-234-5678',
    'bangkok@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

-- Bangkok: Room Types

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000101',
        'b0000000-0000-0000-0000-000000000001',
        'Superior King',
        'SUP-KG',
        'Elegant room with city views, premium king-size bed, and contemporary Thai-inspired décor. Perfect for business and leisure travellers seeking comfort in the heart of Bangkok.',
        2, 2800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "tv", "coffee_maker", "bathrobe", "hairdryer"]',
        32, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000102',
        'b0000000-0000-0000-0000-000000000001',
        'Deluxe City View',
        'DLX-CV',
        'Spacious deluxe room offering sweeping panoramic views of the Bangkok skyline. Features a separate seating area, marble bathroom with soaking tub, and curated local artwork.',
        2, 3800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers"]',
        42, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000103',
        'b0000000-0000-0000-0000-000000000001',
        'Junior Suite',
        'JR-STE',
        'Generous suite with a separate living room, premium minibar, and floor-to-ceiling windows framing the city skyline. Includes complimentary evening cocktails at the sky lounge.',
        3, 5500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "nespresso", "butler_service"]',
        65, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000104',
        'b0000000-0000-0000-0000-000000000001',
        'Grand Suite',
        'GRD-STE',
        'The pinnacle of Bangkok luxury — a two-room grand suite with private dining area, butler service, wrap-around terrace, and bespoke Thai silk furnishings with commanding 360° city views.',
        4, 9800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "nespresso", "butler_service", "private_dining", "jacuzzi"]',
        120, 'king'
    )
ON CONFLICT DO NOTHING;

-- Bangkok: Rooms

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    -- Superior King (floors 5-15)
    ('d0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', '501',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', '502',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000103', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', '503',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000104', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', '1001', 10, 'available'),
    ('d0000000-0000-0000-0000-000000000105', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', '1002', 10, 'available'),
    -- Deluxe City View (floors 16-25)
    ('d0000000-0000-0000-0000-000000000111', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000102', '1601', 16, 'available'),
    ('d0000000-0000-0000-0000-000000000112', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000102', '1602', 16, 'available'),
    ('d0000000-0000-0000-0000-000000000113', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000102', '2001', 20, 'available'),
    ('d0000000-0000-0000-0000-000000000114', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000102', '2002', 20, 'available'),
    -- Junior Suite (floors 26-32)
    ('d0000000-0000-0000-0000-000000000121', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000103', '2601', 26, 'available'),
    ('d0000000-0000-0000-0000-000000000122', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000103', '2602', 26, 'available'),
    ('d0000000-0000-0000-0000-000000000123', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000103', '3001', 30, 'available'),
    -- Grand Suite (floors 33-35)
    ('d0000000-0000-0000-0000-000000000131', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000104', '3301', 33, 'available'),
    ('d0000000-0000-0000-0000-000000000132', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000104', '3501', 35, 'available'),
    ('d0000000-0000-0000-0000-000000000133', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000104', '3502', 35, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 2: Maitri Villa Chiang Mai
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Villa Chiang Mai',
    'maitri-chiangmai',
    'boutique',
    '15 Nimman Soi 9, Suthep',
    'Chiang Mai',
    'Thailand',
    '+66-53-210-999',
    'chiangmai@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1540541338537-1220205ac293?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

-- Chiang Mai: Room Types

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000201',
        'b0000000-0000-0000-0000-000000000002',
        'Lanna Garden Room',
        'LAN-GD',
        'Beautifully appointed room inspired by traditional Lanna architecture, surrounded by a lush tropical garden. Hand-carved teak furniture and silk textiles celebrate the artisanal heritage of Northern Thailand.',
        2, 2200.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "garden_view", "outdoor_shower"]',
        38, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000202',
        'b0000000-0000-0000-0000-000000000002',
        'Pool Access Room',
        'POOL-AC',
        'Intimate room with direct step-out access to the villa's serene saltwater pool. Blends indoor comfort with outdoor living through full-width sliding doors opening onto a private sala.',
        2, 3200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "pool_access", "outdoor_sala"]',
        48, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000203',
        'b0000000-0000-0000-0000-000000000002',
        'Private Pool Villa',
        'PRV-VL',
        'A secluded sanctuary featuring a 10-metre private pool, open-air pavilion, and dedicated butler. Immerse yourself in the tranquility of the mountains with in-villa Lanna-inspired spa treatments available on request.',
        4, 6500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "outdoor_sala", "nespresso", "in_villa_dining"]',
        180, 'king'
    )
ON CONFLICT DO NOTHING;

-- Chiang Mai: Rooms

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    -- Lanna Garden Room (floor 1)
    ('d0000000-0000-0000-0000-000000000201', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000201', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000202', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000201', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000203', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000201', '103', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000204', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000201', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000205', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000201', '202', 2, 'available'),
    -- Pool Access Room (floor 1-2)
    ('d0000000-0000-0000-0000-000000000211', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000202', '104', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000212', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000202', '105', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000213', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000202', '203', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000214', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000202', '204', 2, 'available'),
    -- Private Pool Villa (floor 1, ground-level villas)
    ('d0000000-0000-0000-0000-000000000221', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000203', 'V01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000222', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000203', 'V02', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000223', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000203', 'V03', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 3: Maitri Beach Resort Phuket
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Beach Resort Phuket',
    'maitri-phuket',
    'resort',
    '88 Kata Beach Road, Mueang Phuket',
    'Phuket',
    'Thailand',
    '+66-76-330-888',
    'phuket@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

-- Phuket: Room Types

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000301',
        'b0000000-0000-0000-0000-000000000003',
        'Ocean View Room',
        'OCN-VW',
        'Light-filled room perched above the Andaman Sea with a furnished balcony perfect for watching dramatic sunsets. Decorated with sea glass accents and natural materials that evoke the beauty of Kata Beach.',
        2, 3500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "tv", "coffee_maker", "bathrobe", "slippers", "ocean_view"]',
        40, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000302',
        'b0000000-0000-0000-0000-000000000003',
        'Beachfront Bungalow',
        'BCH-BNG',
        'Set directly on the sand with a private terrace steps from the water, this thatched bungalow offers an unrivalled beachfront experience. Enjoy open-air rain showers and dine beneath the stars on your own terrace.',
        3, 5200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "beachfront", "outdoor_shower", "beach_chairs"]',
        60, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000303',
        'b0000000-0000-0000-0000-000000000003',
        'Ocean Pool Villa',
        'OCN-VL',
        'Ultra-exclusive cliffside villa with an infinity pool that merges seamlessly with the Andaman horizon. This pinnacle of Phuket luxury includes a private chef, dedicated butler, and direct beach access via a private pathway.',
        4, 9500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "in_villa_dining", "nespresso", "jacuzzi", "beach_access"]',
        200, 'king'
    )
ON CONFLICT DO NOTHING;

-- Phuket: Rooms

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    -- Ocean View Room (floors 2-4)
    ('d0000000-0000-0000-0000-000000000301', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000301', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000302', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000301', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000303', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000301', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000304', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000301', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000305', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000301', '401', 4, 'available'),
    -- Beachfront Bungalow (floor 1, ground level)
    ('d0000000-0000-0000-0000-000000000311', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000302', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000312', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000302', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000313', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000302', '103', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000314', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000302', '104', 1, 'available'),
    -- Ocean Pool Villa (floor 4, clifftop)
    ('d0000000-0000-0000-0000-000000000321', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000303', 'V01', 4, 'available'),
    ('d0000000-0000-0000-0000-000000000322', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000303', 'V02', 4, 'available'),
    ('d0000000-0000-0000-0000-000000000323', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000303', 'V03', 4, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 4: Maitri Retreat Koh Samui
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Retreat Koh Samui',
    'maitri-samui',
    'resort',
    '118 Chaweng Beach Road, Bo Phut',
    'Koh Samui',
    'Thailand',
    '+66-77-960-555',
    'samui@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

-- Koh Samui: Room Types

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000401',
        'b0000000-0000-0000-0000-000000000004',
        'Tropical Garden Room',
        'TRP-GD',
        'A serene retreat nestled within a verdant coconut-palm garden on the island of Koh Samui. The room's natural rattan furnishings, open-air rain shower, and soothing earthy palette create a genuine sense of island escape.',
        2, 2900.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "garden_view", "outdoor_shower", "hammock"]',
        38, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000402',
        'b0000000-0000-0000-0000-000000000004',
        'Sea View Room',
        'SEA-VW',
        'Elevated room with unobstructed Gulf of Thailand vistas from a furnished terrace. Fall asleep to the sound of the waves and wake up to mesmerising sea views framed by lush tropical foliage.',
        2, 4200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "sea_view", "nespresso"]',
        48, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000403',
        'b0000000-0000-0000-0000-000000000004',
        'Beach Pool Villa',
        'BCH-VL',
        'The ultimate Samui indulgence — a private pool villa situated on the beachfront with direct sand access. Enjoy a personal sundeck, outdoor rain shower, and in-villa dining prepared by your dedicated butler.',
        4, 8800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "beach_access", "in_villa_dining", "nespresso", "jacuzzi"]',
        190, 'king'
    )
ON CONFLICT DO NOTHING;

-- Koh Samui: Rooms

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    -- Tropical Garden Room (floors 1-2)
    ('d0000000-0000-0000-0000-000000000401', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000401', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000402', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000401', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000403', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000401', '103', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000404', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000401', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000405', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000401', '202', 2, 'available'),
    -- Sea View Room (floors 2-3)
    ('d0000000-0000-0000-0000-000000000411', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000402', '203', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000412', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000402', '204', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000413', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000402', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000414', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000402', '302', 3, 'available'),
    -- Beach Pool Villa (floor 1, ground-level beachfront)
    ('d0000000-0000-0000-0000-000000000421', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000403', 'V01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000422', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000403', 'V02', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000423', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000403', 'V03', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 5: Maitri Grand Pattaya
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Grand Pattaya',
    'maitri-pattaya',
    'hotel',
    '333 Jomtien Beach Road, Nongprue',
    'Pattaya',
    'Thailand',
    '+66-38-250-777',
    'pattaya@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

-- Pattaya: Room Types

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000501',
        'b0000000-0000-0000-0000-000000000005',
        'City View Room',
        'CTY-VW',
        'Modern and well-appointed room with a lively cityscape outlook. Ideal for both business and leisure guests, featuring contemporary Thai accents, a work desk, and all essential amenities for a comfortable stay in Pattaya.',
        2, 1800.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "work_desk", "city_view"]',
        30, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000502',
        'b0000000-0000-0000-0000-000000000005',
        'Sea View Deluxe',
        'SEA-DLX',
        'Stylish deluxe room with panoramic views of the Gulf of Thailand from a private balcony. The open-plan layout and floor-to-ceiling glazing ensure the sea is always the centrepiece of your stay.',
        2, 2800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "sea_view"]',
        40, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000503',
        'b0000000-0000-0000-0000-000000000005',
        'Sky Suite',
        'SKY-STE',
        'Commanding the upper floors with sweeping 180° Gulf of Thailand and city views, the Sky Suite offers a refined retreat above the energy of Pattaya. A separate lounge, premium wet bar, and butler service complete this sky-high sanctuary.',
        3, 5500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "butler_service", "nespresso", "wet_bar", "panoramic_view", "jacuzzi"]',
        90, 'king'
    )
ON CONFLICT DO NOTHING;

-- Pattaya: Rooms

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    -- City View Room (floors 5-20)
    ('d0000000-0000-0000-0000-000000000501', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000501', '501',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000502', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000501', '502',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000503', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000501', '503',  5,  'available'),
    ('d0000000-0000-0000-0000-000000000504', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000501', '1001', 10, 'available'),
    ('d0000000-0000-0000-0000-000000000505', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000501', '2001', 20, 'available'),
    -- Sea View Deluxe (floors 21-35)
    ('d0000000-0000-0000-0000-000000000511', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000502', '2101', 21, 'available'),
    ('d0000000-0000-0000-0000-000000000512', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000502', '2102', 21, 'available'),
    ('d0000000-0000-0000-0000-000000000513', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000502', '3001', 30, 'available'),
    ('d0000000-0000-0000-0000-000000000514', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000502', '3501', 35, 'available'),
    -- Sky Suite (floors 36-40)
    ('d0000000-0000-0000-0000-000000000521', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000503', '3601', 36, 'available'),
    ('d0000000-0000-0000-0000-000000000522', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000503', '3801', 38, 'available'),
    ('d0000000-0000-0000-0000-000000000523', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000503', '4001', 40, 'available')
ON CONFLICT DO NOTHING;
