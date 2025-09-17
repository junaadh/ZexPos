-- Fix receipts table schema to match the application requirements
-- This script adds missing columns and updates the receipt_type enum

-- Add missing columns to receipts table
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES auth.users(id);

-- Update the receipt_type constraint to match the application expectations
ALTER TABLE public.receipts 
DROP CONSTRAINT IF EXISTS receipts_receipt_type_check;

ALTER TABLE public.receipts 
ADD CONSTRAINT receipts_receipt_type_check 
CHECK (receipt_type IN ('payment', 'refund', 'void', 'customer', 'kitchen', 'merchant'));

-- Create index for better performance on restaurant queries
CREATE INDEX IF NOT EXISTS idx_receipts_restaurant_id ON public.receipts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_at ON public.receipts(generated_at);

-- Update existing receipts to have restaurant_id from their order
UPDATE public.receipts 
SET restaurant_id = o.restaurant_id
FROM public.orders o
WHERE receipts.order_id = o.id
AND receipts.restaurant_id IS NULL;

-- Make restaurant_id NOT NULL after backfilling
ALTER TABLE public.receipts 
ALTER COLUMN restaurant_id SET NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES FOR RECEIPTS
-- =============================================================================

-- Enable RLS on receipts table
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Receipts access control" ON public.receipts;
DROP POLICY IF EXISTS "Receipts insert control" ON public.receipts;
DROP POLICY IF EXISTS "Receipts update control" ON public.receipts;
DROP POLICY IF EXISTS "Receipts delete control" ON public.receipts;

-- Policy for SELECT: Users can only see receipts from restaurants in their organization
CREATE POLICY "Receipts select policy" ON public.receipts
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT r.id 
      FROM public.restaurants r 
      WHERE r.organization_id = public.user_organization_id()
    )
  );

-- Policy for INSERT: Users can only create receipts for restaurants in their organization
CREATE POLICY "Receipts insert policy" ON public.receipts
  FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT r.id 
      FROM public.restaurants r 
      WHERE r.organization_id = public.user_organization_id()
    )
  );

-- Policy for UPDATE: Users can only update receipts from restaurants in their organization
CREATE POLICY "Receipts update policy" ON public.receipts
  FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT r.id 
      FROM public.restaurants r 
      WHERE r.organization_id = public.user_organization_id()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT r.id 
      FROM public.restaurants r 
      WHERE r.organization_id = public.user_organization_id()
    )
  );

-- Policy for DELETE: Users can only delete receipts from restaurants in their organization
CREATE POLICY "Receipts delete policy" ON public.receipts
  FOR DELETE
  USING (
    restaurant_id IN (
      SELECT r.id 
      FROM public.restaurants r 
      WHERE r.organization_id = public.user_organization_id()
    )
  );
