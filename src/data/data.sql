-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    plan_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('weekly', 'monthly', 'yearly')),
    duration VARCHAR(50) NOT NULL CHECK (duration IN ('full-day', 'half-day', 'morning', 'afternoon', 'custom')),
    days TEXT[] NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    services TEXT[] NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON subscriptions(type);
