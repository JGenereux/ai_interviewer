import express from 'express';
import Stripe from 'stripe';
import dbClient from '../db/client'
import { BillingHistory } from '../Types/billingHistory';
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/create-checkout-session/subscription', async (req, res) => {
    const { priceId, userId } = req.body;
    if (!priceId || !userId) {
        res.status(400).json({ error: 'Missing priceId or userId' });
        return;
    }
    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/interview`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing`,
        client_reference_id: userId,
    })

    res.json({ url: session.url });
})

router.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  console.log('hit')
    let event: Stripe.Event | null = null;
  if (endpointSecret) {
    const signature = request.headers['stripe-signature'] || '';
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`, (err as any).message);
      return response.sendStatus(400);
    }

    // Handle the event
  switch (event?.type) {
    case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
    
        const { mode } = session;
        if (!userId || !mode) {
            console.error('Webhook Error: Missing userId or mode in session.');
            break;
        }

        if (session.payment_status !== 'paid') {
            console.error('Webhook Error: Payment not successful.');
            break;
        }

        if (mode === 'subscription') {
            const userSubscriptionID = session.subscription;
            const subscriptionInfo = await stripe.subscriptions.retrieve(userSubscriptionID as string);
            const priceId = subscriptionInfo.items.data[0]?.plan.id;
            
            let subscriptionType = 'free';
            let tokens = 0
            const ONE_INTERVIEW = 750 // ONE INTERVIEW = 750 ($0.75)
            switch (priceId) {
                case 'price_1Sk46dA001HlwyT5qIwsFCpH': // Starter
                    subscriptionType = 'starter';
                    tokens = ONE_INTERVIEW * 6;
                    break;
                case 'price_1Sk470A001HlwyT5VVokmv1M': // Pro
                    subscriptionType = 'pro';
                    tokens = ONE_INTERVIEW * 15;
                    break;
                default:
                    console.error('Webhook Error: Invalid priceId.');
                    break;
            }

            const newSubscription = {
                id: userSubscriptionID,
                subscription: subscriptionType,
            }

            const { data: userData, error } = await dbClient.from('users').select('*').eq('id', userId).single();
            if (error) throw error;
            if (userData) {
                const userTokens = userData.tokens >= 0 ? userData.tokens + tokens : tokens;
                const { error: updateError } = await dbClient.from('users').update({ tokens: userTokens, subscription: newSubscription }).eq('id', userId);
                if (updateError) throw updateError;
            }

            const billingHistory: Omit<BillingHistory, 'id'> = {
                userId: userId,
                stripeId: session.id,
                amount: session.amount_total || 0,
                description: `Subscribed to ${subscriptionType} plan`,
                createdAt: new Date(),
                type: 'subscription',
            }
            const { error: billingHistoryError } = await dbClient.from('billing_history').insert(billingHistory);
            if (billingHistoryError) throw billingHistoryError;
        }
        break;
    default:
      console.log(`Unhandled event type ${event?.type}`);
  }

  response.json({received: true});
}});

router.get('/billing-history/:userId', async (req, res) => {
    const { userId } = req.params;
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { data: { user } } = await dbClient.auth.getUser(accessToken);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (userId !== user.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { data, error } = await dbClient.from('billing_history').select('*').eq('userId', userId);
    if (error) throw error;
    res.json(data);
})

export default router;