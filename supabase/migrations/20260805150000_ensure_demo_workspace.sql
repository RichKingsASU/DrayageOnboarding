-- Migration to add ensure_demo_workspace RPC for automatic staging authentication provisioning

CREATE OR REPLACE FUNCTION public.ensure_demo_workspace()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_result json;
BEGIN
  -- 1. Identify the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. ensure_demo_workspace requires a valid Supabase session.';
  END IF;

  -- 2. Check if a demo workspace already exists for this user (Idempotency)
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE organization_id = v_user_id
  LIMIT 1;

  IF v_account_id IS NOT NULL THEN
    RETURN json_build_object(
      'status', 'existing',
      'account_id', v_account_id,
      'message', 'Demo workspace already exists for this user.'
    );
  END IF;

  -- 3. Create synthetic demo account
  INSERT INTO public.accounts (
    organization_id,
    legal_name,
    stage,
    commodity,
    expected_weight
  )
  VALUES (
    v_user_id,
    'OnDray Demo Customer',
    'CustomerInquiry',
    'Electronics / Consumer Goods',
    '40000 lbs'
  )
  RETURNING id INTO v_account_id;

  -- 4. Create synthetic SOP instructions
  INSERT INTO public.accessorial_sops (
    account_id,
    chassis_fee,
    pre_pull_fee,
    delivery_rules
  )
  VALUES (
    v_account_id,
    35.00,
    150.00,
    'Demo instructions: Please ensure all drivers check in with dispatch 30 minutes prior to arrival. No split chassis allowed on demo loads.'
  );

  -- 5. Return success result
  RETURN json_build_object(
    'status', 'created',
    'account_id', v_account_id,
    'message', 'Demo workspace successfully provisioned.'
  );
END;
$$;
