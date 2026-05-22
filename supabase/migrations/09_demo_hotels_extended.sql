-- =============================================================================
-- Migration: 09_demo_hotels_extended.sql
-- Description: 10 additional Maitri Collection demo hotels across Thailand
-- Idempotent: uses ON CONFLICT DO NOTHING with hardcoded UUIDs
-- Hotels 6-15 (UUIDs b0000000-...0006 through ...0015)
-- =============================================================================


-- =============================================================================
-- HOTEL 6: Maitri Andaman Krabi
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Andaman Krabi',
    'maitri-krabi',
    'resort',
    '55 Railay Beach West, Ao Nang',
    'Krabi',
    'Thailand',
    '+66-75-622-999',
    'krabi@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000601',
        'b0000000-0000-0000-0000-000000000006',
        'Cliff View Room',
        'CLF-VW',
        'Tucked into a limestone karst, this breezy room opens onto one of Krabi''s most dramatic natural backdrops. Wake to towering cliffs and emerald coves, with open-air design that brings the Andaman indoors.',
        2, 2600.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "cliff_view", "outdoor_shower"]',
        36, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000602',
        'b0000000-0000-0000-0000-000000000006',
        'Andaman Sea View',
        'AND-VW',
        'Perched above the Andaman with a wide teak terrace framing the sea and limestone islands. The room''s cool white linen and natural stone finishes let the extraordinary view take centre stage.',
        2, 4200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "sea_view"]',
        48, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000603',
        'b0000000-0000-0000-0000-000000000006',
        'Rainforest Pool Villa',
        'RFT-VL',
        'A private sanctuary hidden within a living rainforest canopy. The villa''s infinity pool catches the sunset over the Andaman while a jungle soundtrack provides a backdrop unlike any other in Thailand.',
        4, 7800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "jungle_view", "nespresso", "outdoor_sala"]',
        170, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000000601', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000601', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000602', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000601', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000603', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000601', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000604', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000601', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000611', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000602', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000612', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000602', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000613', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000602', '401', 4, 'available'),
    ('d0000000-0000-0000-0000-000000000621', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000603', 'V01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000622', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000603', 'V02', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000623', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000603', 'V03', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 7: Maitri Palace Hua Hin
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Palace Hua Hin',
    'maitri-huahin',
    'resort',
    '12 Naresdamri Road, Hua Hin',
    'Hua Hin',
    'Thailand',
    '+66-32-530-666',
    'huahin@maitri.co.th',
    'THB',
    '15:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000701',
        'b0000000-0000-0000-0000-000000000007',
        'Royal Garden Room',
        'RYL-GD',
        'Elegant Colonial-style room overlooking manicured royal gardens in Hua Hin''s most prestigious address. Appointed with silk-upholstered furnishings and antique Thai artefacts evoking the resort''s century-long heritage.',
        2, 2800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "tv", "coffee_maker", "bathrobe", "garden_view"]',
        40, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000702',
        'b0000000-0000-0000-0000-000000000007',
        'Ocean Terrace Room',
        'OCN-TR',
        'Generous room with a wide furnished terrace gazing across the Gulf of Thailand. The gently undulating horizon, trade-wind breezes, and the faint sound of surf are the only appointments needed.',
        2, 4500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "sea_view", "nespresso"]',
        52, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000703',
        'b0000000-0000-0000-0000-000000000007',
        'Royal Pool Suite',
        'RYL-STE',
        'A palatial two-bedroom suite with private plunge pool and butler service, befitting its position in Hua Hin''s royal resort town. Curated antiques, hand-embroidered linens, and panoramic Gulf views complete the regal experience.',
        4, 8500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "butler_service", "private_pool", "nespresso", "sea_view", "jacuzzi", "in_villa_dining"]',
        160, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000000701', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000701', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000702', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000701', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000703', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000701', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000704', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000701', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000711', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000702', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000712', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000702', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000713', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000702', '401', 4, 'available'),
    ('d0000000-0000-0000-0000-000000000714', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000702', '402', 4, 'available'),
    ('d0000000-0000-0000-0000-000000000721', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000703', 'V01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000722', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000703', 'V02', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 8: Maitri Heritage Ayutthaya
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Heritage Ayutthaya',
    'maitri-ayutthaya',
    'boutique',
    '9/1 U-Thong Road, Pratu Chai',
    'Ayutthaya',
    'Thailand',
    '+66-35-241-888',
    'ayutthaya@maitri.co.th',
    'THB',
    '14:00',
    '11:00',
    0.07,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000801',
        'b0000000-0000-0000-0000-000000000008',
        'Heritage River Room',
        'HRT-RV',
        'Thoughtfully restored in a 19th-century merchant townhouse on the banks of the Chao Phraya. Original hardwood floors, exposed brick, and bespoke antique furnishings sit alongside modern comforts to create an authentic connection to Ayutthaya''s storied past.',
        2, 2400.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "river_view", "heritage_decor"]',
        34, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000802',
        'b0000000-0000-0000-0000-000000000008',
        'Temple View Suite',
        'TMP-STE',
        'Look out from your private balcony onto the golden spires of Wat Phra Si Sanphet as the sun rises over the ancient capital. Furnished with museum-quality Thai royal antiques and handwoven silks from the royal weaving tradition.',
        2, 3800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "temple_view", "heritage_decor", "nespresso"]',
        58, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000803',
        'b0000000-0000-0000-0000-000000000008',
        'Royal Pavilion',
        'RYL-PAV',
        'An entire restored royal sala — a free-standing riverside pavilion available as a private residence. Personal butler, morning elephant blessing ceremony, and a sunset cruise on the Chao Phraya make this the most memorable stay in ancient Siam.',
        4, 7200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "butler_service", "river_view", "nespresso", "private_pavilion", "in_villa_dining"]',
        140, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000000801', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000801', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000802', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000801', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000803', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000801', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000804', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000801', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000811', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000802', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000812', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000802', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000813', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000802', '303', 3, 'available'),
    ('d0000000-0000-0000-0000-000000000821', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000803', 'P01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000822', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000803', 'P02', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 9: Maitri Island Koh Phi Phi
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Island Koh Phi Phi',
    'maitri-phiphi',
    'resort',
    '7 Moo 7, Ton Sai Bay, Ko Phi Phi',
    'Koh Phi Phi',
    'Thailand',
    '+66-75-628-500',
    'phiphi@maitri.co.th',
    'THB',
    '15:00',
    '11:00',
    0.07,
    'https://images.unsplash.com/photo-1537953773345-d172ccf13cf4?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000000901',
        'b0000000-0000-0000-0000-000000000009',
        'Tropical Bungalow',
        'TRP-BNG',
        'An idyllic thatched bungalow steps from the crystalline waters of Ton Sai Bay. Simple, beautiful, and entirely in harmony with Koh Phi Phi''s legendary island setting. Coral-sand pathways lead straight to the sea.',
        2, 3800.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "beach_access", "outdoor_shower"]',
        38, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000000902',
        'b0000000-0000-0000-0000-000000000009',
        'Bay View Pavilion',
        'BAY-PAV',
        'Elevated hilltop pavilion with unobstructed panoramas of Maya Bay and the twin-peaked Phi Phi island silhouette. The most photographed view in Thailand, savoured from your own private terrace.',
        2, 5500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "bay_view", "nespresso"]',
        55, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000000903',
        'b0000000-0000-0000-0000-000000000009',
        'Overwater Bungalow',
        'OWT-BNG',
        'Thailand''s most exclusive over-water retreat — a private bungalow suspended above the Andaman with a glass floor panel, direct-drop infinity pool ladder, and a hammock deck hovering above the coral reef.',
        2, 12000.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "overwater", "private_pool", "butler_service", "nespresso", "snorkeling_gear"]',
        80, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000000901', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000901', 'B01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000902', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000901', 'B02', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000903', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000901', 'B03', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000904', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000901', 'B04', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000911', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000902', 'H01', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000912', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000902', 'H02', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000913', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000902', 'H03', 2, 'available'),
    ('d0000000-0000-0000-0000-000000000921', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000903', 'OW1', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000922', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000903', 'OW2', 1, 'available'),
    ('d0000000-0000-0000-0000-000000000923', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000903', 'OW3', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 10: Maitri Forest Khao Yai
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Forest Khao Yai',
    'maitri-khaoyai',
    'resort',
    '99 Moo 4, Mu Si, Pak Chong',
    'Khao Yai',
    'Thailand',
    '+66-44-756-777',
    'khaoyai@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001001',
        'b0000000-0000-0000-0000-000000000010',
        'Forest View Room',
        'FST-VW',
        'A cool, calm retreat embedded within the UNESCO World Heritage forest of Khao Yai. Floor-to-ceiling glass walls let in morning mist and the sound of gibbons at dawn, while a wood-burning fireplace keeps evenings cosy.',
        2, 3200.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "forest_view", "fireplace", "rain_shower"]',
        40, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001002',
        'b0000000-0000-0000-0000-000000000010',
        'Vineyard Terrace Suite',
        'VYD-STE',
        'A spacious suite overlooking Khao Yai''s celebrated wine country, with a large terrace for sundown wine tasting. Includes a curated minibar of local vintages and a private guide for an evening vineyard walk.',
        2, 5200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "vineyard_view", "nespresso", "wine_tasting", "fireplace"]',
        65, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001003',
        'b0000000-0000-0000-0000-000000000010',
        'Treetop Pool Villa',
        'TRT-VL',
        'Thailand''s most elevated treehouse experience — a luxury villa cantilevered over the forest canopy at 30 metres, with a heated infinity pool and stargazing deck. Wake to elephants grazing at the forest edge below.',
        4, 9500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "forest_view", "nespresso", "fireplace", "telescope"]',
        200, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001001', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001001', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001002', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001001', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001003', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001001', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001004', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001001', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001011', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001002', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001012', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001002', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001013', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001002', '303', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001021', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001003', 'T01', 4, 'available'),
    ('d0000000-0000-0000-0000-000000001022', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000001003', 'T02', 4, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 11: Maitri Riverside Chiang Rai
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Riverside Chiang Rai',
    'maitri-chiangrai',
    'boutique',
    '5 Moo 1, Wiang, Chiang Rai',
    'Chiang Rai',
    'Thailand',
    '+66-53-716-444',
    'chiangrai@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001101',
        'b0000000-0000-0000-0000-000000000011',
        'Kok River Room',
        'KOK-RV',
        'A serene boutique room perched above the Kok River in northern Thailand''s most culturally rich town. Wake to river mist and the bells of nearby White Temple; unwind with a private Akha hill-tribe wellness ritual.',
        2, 2200.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "river_view", "rain_shower"]',
        35, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001102',
        'b0000000-0000-0000-0000-000000000011',
        'Golden Triangle Suite',
        'GLD-TRG',
        'A refined suite inspired by the traditions of the Golden Triangle — Burmese lacquerware, Shan silver, and hand-loom fabrics from the hill tribes surround a panoramic balcony facing the confluence of the Mekong and Ruak rivers.',
        2, 4200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "river_view", "nespresso", "heritage_decor"]',
        60, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001103',
        'b0000000-0000-0000-0000-000000000011',
        'Hill-Tribe Villa',
        'HLT-VL',
        'A private hilltop villa set within a working organic tea plantation, blending Akha architecture with contemporary luxury. The villa''s wraparound deck overlooks Chiang Rai''s terraced tea fields all the way to the Myanmar border.',
        4, 7500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "mountain_view", "nespresso", "tea_tasting", "outdoor_sala"]',
        175, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001101', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001101', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001102', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001101', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001103', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001101', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001104', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001101', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001111', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001102', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001112', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001102', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001113', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001102', '303', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001121', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001103', 'V01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001122', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000001103', 'V02', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 12: Maitri Seaview Cha-am
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Seaview Cha-am',
    'maitri-chaam',
    'hotel',
    '241 Ruamjit Road, Cha-am',
    'Cha-am',
    'Thailand',
    '+66-32-470-888',
    'chaam@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001201',
        'b0000000-0000-0000-0000-000000000012',
        'Standard Sea Room',
        'STD-SEA',
        'A cheerful, well-appointed room with partial sea glimpses on the quiet Gulf Coast north of Hua Hin. Ideal for families and weekend escapes from Bangkok, with direct access to Cha-am''s calm, uncrowded beach.',
        2, 1800.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "sea_glimpse", "beach_access"]',
        30, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001202',
        'b0000000-0000-0000-0000-000000000012',
        'Superior Sea View',
        'SUP-SEA',
        'A superior-grade room with a wide balcony overlooking the Gulf of Thailand. Cha-am''s gentle two-kilometre beach stretches below, and at low tide you can walk hundreds of metres into the warm, shallow water.',
        3, 2800.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "tv", "coffee_maker", "bathrobe", "sea_view", "beach_access"]',
        42, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001203',
        'b0000000-0000-0000-0000-000000000012',
        'Beachfront Suite',
        'BCH-STE',
        'A coveted ground-floor suite with a private garden terrace opening directly onto the sand. The largest suite on the property, with a walk-in rainfall shower, soaking tub, and an oversized daybed facing the sea.',
        4, 5500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "beachfront", "nespresso", "private_garden", "beach_chairs"]',
        90, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001201', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001201', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001202', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001201', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001203', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001201', '301', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001204', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001201', '302', 3, 'available'),
    ('d0000000-0000-0000-0000-000000001205', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001201', '401', 4, 'available'),
    ('d0000000-0000-0000-0000-000000001211', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001202', '501', 5, 'available'),
    ('d0000000-0000-0000-0000-000000001212', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001202', '502', 5, 'available'),
    ('d0000000-0000-0000-0000-000000001213', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001202', '601', 6, 'available'),
    ('d0000000-0000-0000-0000-000000001214', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001202', '602', 6, 'available'),
    ('d0000000-0000-0000-0000-000000001221', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001203', '101', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001222', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001203', '102', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001223', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000001203', '103', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 13: Maitri Lagoon Koh Lanta
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Lagoon Koh Lanta',
    'maitri-kohlanta',
    'resort',
    '65 Moo 2, Klong Dao Beach, Ko Lanta',
    'Koh Lanta',
    'Thailand',
    '+66-75-684-333',
    'kohlanta@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001301',
        'b0000000-0000-0000-0000-000000000013',
        'Garden Bungalow',
        'GDN-BNG',
        'A romantic bungalow tucked within a lush tropical garden on the languid island of Koh Lanta. The unhurried island pace sets in immediately — a hammock beneath swaying palms, a bicycle to explore the old town, and warm shallow lagoon waters at your feet.',
        2, 2900.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "bathrobe", "garden_view", "hammock", "bicycle"]',
        38, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001302',
        'b0000000-0000-0000-0000-000000000013',
        'Lagoon View Room',
        'LAG-VW',
        'The centrepiece of Koh Lanta''s most serene resort — a spacious room whose floor-to-ceiling windows frame a still, mangrove-fringed lagoon at sunset. The shifting light and its reflection create a living painting unlike anything else in Thailand.',
        2, 4500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "lagoon_view", "nespresso", "kayak_access"]',
        52, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001303',
        'b0000000-0000-0000-0000-000000000013',
        'Floating Pool Villa',
        'FLT-VL',
        'Koh Lanta''s only floating pool villa — a private teak-decked structure moored on the lagoon''s edge with a 15-metre private pool that blends seamlessly with the water beyond. Starlit outdoor bathing, kayaking from your doorstep, and absolute silence.',
        4, 10500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "private_pool", "butler_service", "lagoon_view", "nespresso", "kayak", "in_villa_dining"]',
        220, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001301', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001301', 'G01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001302', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001301', 'G02', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001303', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001301', 'G03', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001304', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001301', 'G04', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001311', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001302', '201', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001312', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001302', '202', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001313', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001302', '203', 2, 'available'),
    ('d0000000-0000-0000-0000-000000001321', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001303', 'F01', 1, 'available'),
    ('d0000000-0000-0000-0000-000000001322', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000001303', 'F02', 1, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 14: Maitri Sukhumvit Bangkok
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Sukhumvit Bangkok',
    'maitri-sukhumvit',
    'hotel',
    '189 Sukhumvit Soi 11, Khlong Toei Nuea',
    'Bangkok',
    'Thailand',
    '+66-2-119-8888',
    'sukhumvit@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001401',
        'b0000000-0000-0000-0000-000000000014',
        'Urban Studio',
        'URB-STD',
        'A sophisticated urban studio designed for the modern Bangkok explorer — a curated neighbourhood of street food, rooftop bars, and gallery spaces at your doorstep. The room''s warm timber interiors, bespoke Thai craft objects, and fast Wi-Fi make it equally at home as a work base or lifestyle retreat.',
        2, 3500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "tv", "coffee_maker", "bathrobe", "work_desk", "bluetooth_speaker", "city_view"]',
        35, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001402',
        'b0000000-0000-0000-0000-000000000014',
        'Skyline Deluxe',
        'SKY-DLX',
        'A deluxe room on the upper floors with a panoramic Bangkok skyline view and private balcony. The BTS Asok station is three minutes on foot — the entire city is your neighbourhood. Complimentary morning workout access to the rooftop infinity pool and fitness studio.',
        2, 5200.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "city_view", "nespresso", "pool_access", "gym_access"]',
        52, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001403',
        'b0000000-0000-0000-0000-000000000014',
        'Penthouse Suite',
        'PNT-STE',
        'The full Bangkok experience distilled into a single floor. The penthouse''s 360° sky deck, private plunge pool, and Michelin-starred in-suite dining experience put the city literally at your feet — from Lumpini Park to the Chao Phraya, the skyline is yours.',
        4, 11000.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "butler_service", "private_pool", "panoramic_view", "nespresso", "in_villa_dining", "concierge", "jacuzzi"]',
        180, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001401', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001401', '1001', 10, 'available'),
    ('d0000000-0000-0000-0000-000000001402', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001401', '1002', 10, 'available'),
    ('d0000000-0000-0000-0000-000000001403', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001401', '1501', 15, 'available'),
    ('d0000000-0000-0000-0000-000000001404', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001401', '1502', 15, 'available'),
    ('d0000000-0000-0000-0000-000000001405', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001401', '2001', 20, 'available'),
    ('d0000000-0000-0000-0000-000000001411', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001402', '2501', 25, 'available'),
    ('d0000000-0000-0000-0000-000000001412', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001402', '2502', 25, 'available'),
    ('d0000000-0000-0000-0000-000000001413', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001402', '3001', 30, 'available'),
    ('d0000000-0000-0000-0000-000000001414', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001402', '3002', 30, 'available'),
    ('d0000000-0000-0000-0000-000000001421', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001403', '3801', 38, 'available'),
    ('d0000000-0000-0000-0000-000000001422', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000001403', '4001', 40, 'available')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- HOTEL 15: Maitri Gateway Nakhon Ratchasima
-- =============================================================================

INSERT INTO hotels (
    id, organization_id, name, slug, type,
    address, city, country, phone, email,
    currency, check_in_time, check_out_time, vat_rate,
    hero_image_url
) VALUES (
    'b0000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000001',
    'Maitri Gateway Korat',
    'maitri-korat',
    'hotel',
    '777 Mitraphap Road, Nai Mueang',
    'Nakhon Ratchasima',
    'Thailand',
    '+66-44-268-555',
    'korat@maitri.co.th',
    'THB',
    '14:00',
    '12:00',
    0.07,
    'https://images.unsplash.com/photo-1551882547-ff40c4a49453?w=1200&q=80&fit=crop'
)
ON CONFLICT DO NOTHING;

INSERT INTO room_types (id, hotel_id, name, code, description, max_occupancy, base_rate, amenities, size_sqm, bed_type)
VALUES
    (
        'c0000000-0000-0000-0000-000000001501',
        'b0000000-0000-0000-0000-000000000015',
        'Comfort Room',
        'CMF-RM',
        'A smartly designed comfort room in the Gateway to Isan — Nakhon Ratchasima, the proud city of the Khorat Plateau. An ideal base for exploring Khao Yai, Phimai Historical Park, and the legendary Korat cat culture.',
        2, 1500.00,
        '["wifi", "air_conditioning", "safe", "tv", "coffee_maker", "work_desk"]',
        28, 'queen'
    ),
    (
        'c0000000-0000-0000-0000-000000001502',
        'b0000000-0000-0000-0000-000000000015',
        'Superior Club Room',
        'SUP-CLB',
        'An elevated superior room with Club Lounge access — afternoon tea, evening cocktails, and complimentary pressing for business travellers. Designed for the Isaan executive, with a deep-soak bathtub and city panorama balcony.',
        2, 2500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "club_lounge", "city_view"]',
        40, 'king'
    ),
    (
        'c0000000-0000-0000-0000-000000001503',
        'b0000000-0000-0000-0000-000000000015',
        'Executive Suite',
        'EXC-STE',
        'The flagship suite of Central Thailand''s most forward-looking business hotel — a full floor-through layout with a separate board room, private chef''s table, and outdoor terrace overlooking the Khorat skyline and distant Khao Yai mountains.',
        3, 5500.00,
        '["wifi", "air_conditioning", "minibar", "safe", "balcony", "bathtub", "tv", "coffee_maker", "bathrobe", "slippers", "butler_service", "nespresso", "boardroom", "city_view", "club_lounge", "airport_transfer"]',
        120, 'king'
    )
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, hotel_id, room_type_id, room_number, floor, status)
VALUES
    ('d0000000-0000-0000-0000-000000001501', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001501', '501',  5,  'available'),
    ('d0000000-0000-0000-0000-000000001502', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001501', '502',  5,  'available'),
    ('d0000000-0000-0000-0000-000000001503', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001501', '503',  5,  'available'),
    ('d0000000-0000-0000-0000-000000001504', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001501', '1001', 10, 'available'),
    ('d0000000-0000-0000-0000-000000001505', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001501', '1002', 10, 'available'),
    ('d0000000-0000-0000-0000-000000001511', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001502', '1501', 15, 'available'),
    ('d0000000-0000-0000-0000-000000001512', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001502', '1502', 15, 'available'),
    ('d0000000-0000-0000-0000-000000001513', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001502', '2001', 20, 'available'),
    ('d0000000-0000-0000-0000-000000001514', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001502', '2002', 20, 'available'),
    ('d0000000-0000-0000-0000-000000001521', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001503', '2501', 25, 'available'),
    ('d0000000-0000-0000-0000-000000001522', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000001503', '2601', 26, 'available')
ON CONFLICT DO NOTHING;
