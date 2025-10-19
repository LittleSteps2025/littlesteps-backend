-- Insert mock subscription plans
INSERT INTO subscriptions (
    name,
    type,
    duration,
    days,
    price,
    services,
    status
) VALUES
    (
        'Basic Weekly Plan',
        'weekly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        15000.00,
        ARRAY['meals', 'snacks', 'nap', 'activities'],
        'active'
    ),
    (
        'Premium Monthly Package',
        'monthly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        55000.00,
        ARRAY['meals', 'snacks', 'nap', 'activities', 'extended-care', 'transport', 'premium-activities'],
        'active'
    ),
    (
        'Half-Day Starter',
        'weekly',
        'morning',
        ARRAY['monday', 'wednesday', 'friday'],
        8000.00,
        ARRAY['meals', 'activities'],
        'active'
    ),
    (
        'Weekend Special',
        'monthly',
        'full-day',
        ARRAY['saturday', 'sunday'],
        25000.00,
        ARRAY['meals', 'snacks', 'activities', 'weekend-care'],
        'active'
    ),
    (
        'Extended Care Plus',
        'monthly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        45000.00,
        ARRAY['meals', 'snacks', 'nap', 'activities', 'extended-care', 'premium-activities'],
        'active'
    ),
    (
        'Afternoon Program',
        'weekly',
        'afternoon',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        12000.00,
        ARRAY['snacks', 'activities', 'nap'],
        'active'
    ),
    (
        'All-Inclusive Annual',
        'yearly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        550000.00,
        ARRAY['meals', 'snacks', 'nap', 'activities', 'extended-care', 'transport', 'premium-activities', 'weekend-care', 'all-inclusive'],
        'active'
    ),
    (
        'Summer Special',
        'monthly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        35000.00,
        ARRAY['meals', 'snacks', 'activities', 'premium-activities'],
        'inactive'
    ),
    (
        'Flexible Care Package',
        'weekly',
        'custom',
        ARRAY['monday', 'wednesday', 'friday'],
        10000.00,
        ARRAY['meals', 'activities', 'extended-care'],
        'active'
    ),
    (
        'Transport Plus Package',
        'monthly',
        'full-day',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        40000.00,
        ARRAY['meals', 'snacks', 'nap', 'activities', 'transport'],
        'active'
    );