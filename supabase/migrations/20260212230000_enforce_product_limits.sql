-- Function to enforce product limits based on user plan
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_plan text;
    current_count integer;
    max_limit integer;
BEGIN
    -- Get user plan
    SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;
    
    -- Default to free if not found (or handle as error)
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;

    -- Set limit based on plan
    IF user_plan = 'pro' THEN
        max_limit := 999999; -- Effectively unlimited
    ELSIF user_plan = 'plus' THEN
        max_limit := 1000;
    ELSE
        max_limit := 50; -- Free tier default
    END IF;

    -- Count existing products
    -- Note: counting might be slow for very large datasets, but for <1000 it's negligible.
    -- For 'pro' users we could skip the count, but let's be safe.
    IF user_plan = 'pro' THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO current_count FROM public.products WHERE user_id = NEW.user_id;

    -- Check limit
    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'Product limit reached for plan % (Limit: %, Current: %)', user_plan, max_limit, current_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to allow idempotent runs
DROP TRIGGER IF EXISTS enforce_product_limit ON public.products;

-- Create trigger
CREATE TRIGGER enforce_product_limit
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION check_product_limit();
