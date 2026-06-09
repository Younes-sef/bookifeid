import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import User from '@/database/models/user.model';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const clerkId = session.client_reference_id;

    if (!clerkId) {
      return new NextResponse('No client_reference_id in session', { status: 400 });
    }

    const priceId = subscription.items.data[0].price.id;

    let tier: 'free' | 'pro' | 'scholar' = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      tier = 'pro';
    } else if (priceId === process.env.STRIPE_SCHOLAR_PRICE_ID) {
      tier = 'scholar';
    }

    await connectToDatabase();

    await User.findOneAndUpdate(
      { clerkId },
      {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        tier,
      },
      { new: true, upsert: true }
    );
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    
    if (!invoice.subscription) {
      return new NextResponse('Webhook handled', { status: 200 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    const priceId = subscription.items.data[0].price.id;

    let tier: 'free' | 'pro' | 'scholar' = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      tier = 'pro';
    } else if (priceId === process.env.STRIPE_SCHOLAR_PRICE_ID) {
      tier = 'scholar';
    }

    await connectToDatabase();

    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        tier,
      }
    );
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;

    const priceId = subscription.items.data[0].price.id;

    let tier: 'free' | 'pro' | 'scholar' = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      tier = 'pro';
    } else if (priceId === process.env.STRIPE_SCHOLAR_PRICE_ID) {
      tier = 'scholar';
    }

    await connectToDatabase();

    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        tier,
      }
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    await connectToDatabase();

    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        tier: 'free',
      }
    );
  }

  return new NextResponse('Webhook handled', { status: 200 });
}
