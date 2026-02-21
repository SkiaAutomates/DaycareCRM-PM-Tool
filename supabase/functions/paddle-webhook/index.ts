import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Paddle Billing Webhook Handler for Supabase Edge Functions
 * This function processes subscription events and updates our database.
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    try {
        // 1. Verify Paddle Signature (Optional but recommended for Production)
        // For this demonstration, we'll process the JSON payload directly.

        const payload = await req.json();
        const eventType = payload.event_type;
        const data = payload.data;

        // 2. Initialize Supabase Admin Client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`🔔 Received Paddle event: ${eventType}`);

        if (eventType === 'subscription.created' || eventType === 'subscription.updated' || eventType === 'subscription.activated') {
            const customData = data.custom_data || {};
            const orgId = customData.organization_id;

            if (!orgId) {
                console.warn("⚠️ No organization_id found in custom_data. Payload ID:", data.id);
                return new Response("No organization_id found", { status: 400 });
            }

            // Determine Plan Tier from Price ID or Name
            // You should map your Paddle Price IDs to your internal tiers here
            const firstItem = data.items[0];
            const priceId = firstItem?.price?.id;
            let planTier = 'starter';

            if (priceId && (priceId.includes('professional') || priceId === 'pri_02k...')) {
                planTier = 'professional';
            } else if (priceId && (priceId.includes('growth') || priceId === 'pri_03l...')) {
                planTier = 'growth';
            }

            // 3. Update/Upsert Subscription record
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    organization_id: orgId,
                    paddle_subscription_id: data.id,
                    paddle_customer_id: data.customer_id,
                    status: data.status, // active, trialing, past_due, canceled
                    plan_tier: planTier,
                    renews_at: data.next_billed_at,
                    trial_ends_at: data.current_billing_period?.ends_at, // for trials
                    updated_at: new Date().toISOString()
                }, { onConflict: 'paddle_subscription_id' });

            if (error) {
                console.error("❌ Database Error:", error);
                throw error;
            }

            console.log(`✅ Processed ${eventType} for Org: ${orgId}`);
        }

        if (eventType === 'subscription.canceled') {
            const orgId = data.custom_data?.organization_id;
            if (orgId) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'canceled', ends_at: data.canceled_at })
                    .eq('paddle_subscription_id', data.id);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (err) {
        console.error("❌ Webhook Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
})
