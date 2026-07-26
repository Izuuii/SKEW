-- Seed data for active news sources
INSERT INTO sources (id, name, listing_url, parser_strategy, is_active, logo_url)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Reuters', 'https://www.reuters.com', 'reuters', true, 'https://www.reuters.com/pf/resources/images/reuters/logo-vertical-default-light.svg'),
    ('22222222-2222-2222-2222-222222222222', 'NPR', 'https://www.npr.org', 'npr', true, 'https://media.npr.org/chrome/news/nprlogo_138x46.gif'),
    ('33333333-3333-3333-3333-333333333333', 'BBC News', 'https://www.bbc.com/news', 'bbc', true, 'https://nav.files.bbci.co.uk/orbit/3.0.0-689.54b1f62/img/bloks/bbc-logo.svg'),
    ('44444444-4444-4444-4444-444444444444', 'The Guardian', 'https://www.theguardian.com', 'guardian', true, 'https://assets.guim.co.uk/images/guardian-logo-100.png'),
    ('55555555-5555-5555-5555-555555555555', 'Fox News', 'https://www.foxnews.com', 'foxnews', true, 'https://static.foxnews.com/static/orion/styles/img/fox-news/og/fox-news-logo.png')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    listing_url = EXCLUDED.listing_url,
    logo_url = EXCLUDED.logo_url;

-- Dummy Article 1 (Analyzed - Reuters)
INSERT INTO articles (
    id,
    source_id,
    original_url,
    canonical_url,
    title,
    image_url,
    published_at,
    raw_text,
    scraped_at,
    analyzed_at
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'https://www.reuters.com/business/energy/global-clean-energy-investments-reach-record-high-2026-07-25/',
    'https://www.reuters.com/business/energy/global-clean-energy-investments-reach-record-high-2026-07-25/',
    'Global Clean Energy Investments Reach Record $1.8 Trillion in 2026',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
    NOW() - INTERVAL '2 hours',
    'Global investments in renewable energy and clean infrastructure surged to a record $1.8 trillion over the past fiscal year, driven by rapid solar expansion and grid modernization across major industrial hubs. Industry analysts attribute the acceleration to competitive pricing, improved storage technology, and supportive international policy frameworks.',
    NOW() - INTERVAL '1 hour',
    NOW()
) ON CONFLICT (original_url) DO NOTHING;

-- Dummy Article 1 Analysis
INSERT INTO article_analyses (
    id,
    article_id,
    summary,
    sentiment_score,
    sentiment_label,
    bias_score,
    bias_label,
    left_percentage,
    center_percentage,
    right_percentage,
    confidence,
    framing_notes,
    loaded_terms,
    disclaimer,
    model
) VALUES (
    'b1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Global clean energy investment reached $1.8 trillion due to solar growth, grid improvements, and supportive policies across key regions.',
    0.45,
    'positive',
    -0.10,
    'center',
    35,
    55,
    10,
    0.92,
    'The report focuses primarily on economic figures, technology advancements, and global energy market metrics with balanced attribution.',
    ARRAY['surged', 'acceleration'],
    'AI-estimated political framing and sentiment insights based solely on article content analysis.',
    'gpt-4o'
) ON CONFLICT (article_id) DO NOTHING;

-- Dummy Article 2 (Analyzed - Fox News)
INSERT INTO articles (
    id,
    source_id,
    original_url,
    canonical_url,
    title,
    image_url,
    published_at,
    raw_text,
    scraped_at,
    analyzed_at
) VALUES (
    'a2222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'https://www.foxnews.com/politics/lawmakers-debate-new-tech-regulatory-bill-amid-economic-concerns',
    'https://www.foxnews.com/politics/lawmakers-debate-new-tech-regulatory-bill-amid-economic-concerns',
    'Congressional Leaders Debate Tech Regulation Bill Amid Economic Growth Concerns',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    NOW() - INTERVAL '4 hours',
    'Lawmakers clashed on Capitol Hill today over proposed regulatory frameworks for emerging technology firms. Critics argue the compliance costs could suppress startup innovation and slow hiring, while proponents insist the guardrails are necessary to protect consumer privacy and market fairness.',
    NOW() - INTERVAL '3 hours',
    NOW()
) ON CONFLICT (original_url) DO NOTHING;

-- Dummy Article 2 Analysis
INSERT INTO article_analyses (
    id,
    article_id,
    summary,
    sentiment_score,
    sentiment_label,
    bias_score,
    bias_label,
    left_percentage,
    center_percentage,
    right_percentage,
    confidence,
    framing_notes,
    loaded_terms,
    disclaimer,
    model
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'Lawmakers debated a tech regulation bill, balancing economic growth and innovation concerns against consumer privacy protections.',
    -0.15,
    'neutral',
    0.30,
    'right',
    15,
    40,
    45,
    0.88,
    'Framing emphasizes economic impact, startup burden, and business regulation costs alongside proponent arguments.',
    ARRAY['clashed', 'suppress innovation'],
    'AI-estimated political framing and sentiment insights based solely on article content analysis.',
    'gpt-4o'
) ON CONFLICT (article_id) DO NOTHING;
