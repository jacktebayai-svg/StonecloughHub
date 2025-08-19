-- ===============================================
-- BUSINESS MANAGEMENT TABLES
-- ===============================================

-- Business Categories
CREATE TABLE business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    parent_id UUID REFERENCES business_categories(id),
    display_order INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL, -- Links to auth.users or profiles table
    description TEXT NOT NULL,
    short_description VARCHAR(280),
    logo_url TEXT,
    cover_image_url TEXT,
    address TEXT NOT NULL,
    ward VARCHAR(100),
    postcode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    social_links JSONB, -- {platform: url}
    category_ids UUID[] NOT NULL,
    tags TEXT[],
    founded DATE,
    employee_count INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    opening_hours JSONB, -- {day: "9am-5pm"}
    services TEXT[],
    amenities TEXT[],
    photos_urls TEXT[],
    avg_rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Reviews
CREATE TABLE business_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    photos_urls TEXT[],
    helpful_count INTEGER DEFAULT 0,
    owner_response TEXT,
    owner_response_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('published', 'pending', 'rejected')),
    report_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, user_id) -- One review per user per business
);

-- Business Services
CREATE TABLE business_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price VARCHAR(100),
    duration VARCHAR(50),
    image_url TEXT,
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Claims
CREATE TABLE business_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    evidence TEXT,
    document_urls TEXT[],
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by UUID,
    UNIQUE(business_id, user_id) -- One claim per user per business
);

-- Business Promotions
CREATE TABLE business_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    promo_code VARCHAR(50),
    discount_value VARCHAR(100),
    terms_and_conditions TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'ended', 'cancelled')),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- DISCUSSIONS BOARD TABLES
-- ===============================================

-- Discussion Categories
CREATE TABLE discussion_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color
    parent_id UUID REFERENCES discussion_categories(id),
    display_order INTEGER DEFAULT 0,
    restricted BOOLEAN DEFAULT FALSE,
    allowed_roles TEXT[], -- ['admin', 'moderator', 'verified']
    post_count INTEGER DEFAULT 0,
    last_post_id UUID,
    last_post_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discussion Topics
CREATE TABLE discussion_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(350) NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES discussion_categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    last_reply_id UUID,
    last_reply_at TIMESTAMP,
    last_reply_user_id UUID,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discussion Replies
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES discussion_replies(id), -- For threaded replies
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    accepted_answer BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden')),
    edited_at TIMESTAMP,
    attachments TEXT[],
    report_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discussion Votes (for topics and replies)
CREATE TABLE discussion_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID NOT NULL, -- Can be topic_id or reply_id
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('topic', 'reply')),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id, item_type) -- One vote per user per item
);

-- Discussion Bookmarks
CREATE TABLE discussion_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic_id UUID NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id) -- One bookmark per user per topic
);

-- Discussion Reports (for moderation)
CREATE TABLE discussion_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID NOT NULL, -- Can be topic_id, reply_id, or review_id
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('topic', 'reply', 'review')),
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('spam', 'offensive', 'off-topic', 'inappropriate', 'other')),
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    UNIQUE(user_id, item_id, item_type) -- One report per user per item
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Business indexes
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_featured ON businesses(featured) WHERE featured = TRUE;
CREATE INDEX idx_businesses_verified ON businesses(verified) WHERE verified = TRUE;
CREATE INDEX idx_businesses_ward ON businesses(ward);
CREATE INDEX idx_businesses_category_ids ON businesses USING GIN(category_ids);
CREATE INDEX idx_businesses_tags ON businesses USING GIN(tags);
CREATE INDEX idx_businesses_location ON businesses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_businesses_avg_rating ON businesses(avg_rating) WHERE avg_rating IS NOT NULL;

-- Business reviews indexes
CREATE INDEX idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX idx_business_reviews_user_id ON business_reviews(user_id);
CREATE INDEX idx_business_reviews_rating ON business_reviews(rating);
CREATE INDEX idx_business_reviews_status ON business_reviews(status);
CREATE INDEX idx_business_reviews_created_at ON business_reviews(created_at);

-- Discussion indexes
CREATE INDEX idx_discussion_topics_category_id ON discussion_topics(category_id);
CREATE INDEX idx_discussion_topics_user_id ON discussion_topics(user_id);
CREATE INDEX idx_discussion_topics_status ON discussion_topics(status);
CREATE INDEX idx_discussion_topics_pinned ON discussion_topics(pinned) WHERE pinned = TRUE;
CREATE INDEX idx_discussion_topics_last_reply_at ON discussion_topics(last_reply_at);
CREATE INDEX idx_discussion_topics_created_at ON discussion_topics(created_at);
CREATE INDEX idx_discussion_topics_tags ON discussion_topics USING GIN(tags);

CREATE INDEX idx_discussion_replies_topic_id ON discussion_replies(topic_id);
CREATE INDEX idx_discussion_replies_user_id ON discussion_replies(user_id);
CREATE INDEX idx_discussion_replies_parent_id ON discussion_replies(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_discussion_replies_created_at ON discussion_replies(created_at);

CREATE INDEX idx_discussion_votes_item_id ON discussion_votes(item_id, item_type);
CREATE INDEX idx_discussion_votes_user_id ON discussion_votes(user_id);

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

-- Update business average rating when reviews change
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE businesses 
    SET 
        avg_rating = (
            SELECT AVG(rating)::DECIMAL(2,1) 
            FROM business_reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND status = 'published'
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM business_reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND status = 'published'
        )
    WHERE id = COALESCE(NEW.business_id, OLD.business_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_rating
    AFTER INSERT OR UPDATE OR DELETE ON business_reviews
    FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Update discussion topic reply counts
CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discussion_topics 
    SET 
        reply_count = (
            SELECT COUNT(*) 
            FROM discussion_replies 
            WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
            AND status = 'published'
        ),
        last_reply_id = (
            SELECT id 
            FROM discussion_replies 
            WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
            AND status = 'published'
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        last_reply_at = (
            SELECT created_at 
            FROM discussion_replies 
            WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
            AND status = 'published'
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        last_reply_user_id = (
            SELECT user_id 
            FROM discussion_replies 
            WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
            AND status = 'published'
            ORDER BY created_at DESC 
            LIMIT 1
        )
    WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_topic_reply_count
    AFTER INSERT OR UPDATE OR DELETE ON discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_topic_reply_count();

-- Update discussion category post counts
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discussion_categories 
    SET 
        post_count = (
            SELECT COUNT(*) 
            FROM discussion_topics 
            WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
            AND status = 'published'
        ),
        last_post_id = (
            SELECT id 
            FROM discussion_topics 
            WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
            AND status = 'published'
            ORDER BY COALESCE(last_reply_at, created_at) DESC 
            LIMIT 1
        ),
        last_post_at = (
            SELECT COALESCE(last_reply_at, created_at) 
            FROM discussion_topics 
            WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
            AND status = 'published'
            ORDER BY COALESCE(last_reply_at, created_at) DESC 
            LIMIT 1
        )
    WHERE id = COALESCE(NEW.category_id, OLD.category_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_post_count
    AFTER INSERT OR UPDATE OR DELETE ON discussion_topics
    FOR EACH ROW EXECUTE FUNCTION update_category_post_count();

-- Update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.item_type = 'topic' THEN
            UPDATE discussion_topics 
            SET 
                upvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = NEW.item_id AND item_type = 'topic' AND vote_type = 'up'),
                downvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = NEW.item_id AND item_type = 'topic' AND vote_type = 'down')
            WHERE id = NEW.item_id;
        ELSIF NEW.item_type = 'reply' THEN
            UPDATE discussion_replies 
            SET 
                upvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = NEW.item_id AND item_type = 'reply' AND vote_type = 'up'),
                downvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = NEW.item_id AND item_type = 'reply' AND vote_type = 'down')
            WHERE id = NEW.item_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        IF OLD.item_type = 'topic' THEN
            UPDATE discussion_topics 
            SET 
                upvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = OLD.item_id AND item_type = 'topic' AND vote_type = 'up'),
                downvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = OLD.item_id AND item_type = 'topic' AND vote_type = 'down')
            WHERE id = OLD.item_id;
        ELSIF OLD.item_type = 'reply' THEN
            UPDATE discussion_replies 
            SET 
                upvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = OLD.item_id AND item_type = 'reply' AND vote_type = 'up'),
                downvotes = (SELECT COUNT(*) FROM discussion_votes WHERE item_id = OLD.item_id AND item_type = 'reply' AND vote_type = 'down')
            WHERE id = OLD.item_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON discussion_votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- ===============================================
-- SAMPLE DATA FOR TESTING
-- ===============================================

-- Insert default discussion categories
INSERT INTO discussion_categories (name, description, slug, icon, color, display_order) VALUES
('General Discussion', 'General community discussions and announcements', 'general', 'MessageCircle', '#3B82F6', 1),
('Council Meetings', 'Discussions about upcoming and past council meetings', 'council-meetings', 'Calendar', '#10B981', 2),
('Local Budget', 'Budget discussions, proposals, and transparency', 'local-budget', 'DollarSign', '#F59E0B', 3),
('Planning Applications', 'Discuss local planning and development projects', 'planning-applications', 'MapPin', '#EF4444', 4),
('Community Services', 'Public services, improvements, and feedback', 'community-services', 'Users', '#8B5CF6', 5),
('Environment & Sustainability', 'Green initiatives, waste management, climate action', 'environment', 'TreePine', '#059669', 6),
('Transportation', 'Roads, public transport, cycling, and accessibility', 'transportation', 'Car', '#DC2626', 7),
('Local Business Support', 'Support local businesses and economic development', 'local-business', 'Store', '#7C3AED', 8);

-- Insert sample business categories
INSERT INTO business_categories (name, description, icon, display_order) VALUES
('Restaurants & Food', 'Dining, cafes, takeaways, and food services', 'UtensilsCrossed', 1),
('Retail & Shopping', 'Shops, boutiques, and retail stores', 'ShoppingBag', 2),
('Health & Beauty', 'Healthcare, salons, fitness, and wellness services', 'Heart', 3),
('Professional Services', 'Legal, financial, consulting, and business services', 'Briefcase', 4),
('Home & Garden', 'Hardware, gardening, home improvement, and maintenance', 'Home', 5),
('Education & Training', 'Schools, tutoring, training, and educational services', 'GraduationCap', 6),
('Entertainment & Leisure', 'Entertainment venues, sports, and recreational activities', 'PartyPopper', 7),
('Automotive', 'Car services, repairs, sales, and automotive supplies', 'Car', 8);
