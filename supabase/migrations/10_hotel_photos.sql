-- =============================================================================
-- Migration 10: Update hotel hero images with curated Unsplash photos
-- Run this AFTER migrations 08 and 09.
-- =============================================================================

-- Hotel 1 · Maitri Collection Bangkok (Silom · luxury high-rise)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Hotel 2 · Maitri Villa Chiang Mai (Nimman · boutique garden)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- Hotel 3 · Maitri Beach Resort Phuket (tropical beachfront)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1540541338537-1d4d1a4e5d08?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000003';

-- Hotel 4 · Maitri Retreat Koh Samui (overwater pool villas)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000004';

-- Hotel 5 · Maitri Grand Pattaya (ocean-view tower)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1551882547-ff40c63fe2fa?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000005';

-- Hotel 6 · Maitri Andaman Krabi (limestone cliffs & private beach)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000006';

-- Hotel 7 · Maitri Palace Hua Hin (royal beachside resort)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000007';

-- Hotel 8 · Maitri Heritage Ayutthaya (historic riverside)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000008';

-- Hotel 9 · Maitri Island Koh Phi Phi (turquoise island paradise)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000009';

-- Hotel 10 · Maitri Forest Khao Yai (jungle eco-lodge)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000010';

-- Hotel 11 · Maitri Riverside Chiang Rai (golden triangle)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000011';

-- Hotel 12 · Maitri Seaview Cha-am (breezy beachfront)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000012';

-- Hotel 13 · Maitri Lagoon Koh Lanta (hidden tropical lagoon)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1512100595-44eea4a38ea4?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000013';

-- Hotel 14 · Maitri Sukhumvit Bangkok (urban boutique)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000014';

-- Hotel 15 · Maitri Gateway Korat (nature gateway)
UPDATE hotels
SET hero_image_url = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85'
WHERE id = 'b0000000-0000-0000-0000-000000000015';
