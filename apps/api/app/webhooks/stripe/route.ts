import { env } from '@/env';
import { analytics } from '@repo/analytics/posthog/server';
import { parseError } from '@repo/observability/error';
import { log } from '@repo/observability/log';
import { stripe } from '@repo/payments';
import type { Stripe } from '@repo/payments';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Definición temporal de la interfaz de usuario hasta que se actualice el modelo
interface UserWithStripe {
  id: string;
  email: string;
  name: string;
}

// Nota: Esta función tendría que modificarse cuando se agregue el campo stripeCustomerId al modelo User
const getUserFromCustomerId = async (customerId: string): Promise<UserWithStripe | null> => {
  // Implementación temporal - en el futuro debería buscar por stripeCustomerId
  // Por ahora simplemente retornamos null, lo que hará que no se procese el evento
  console.log('Stripe customer ID:', customerId);
  return null;

  // Implementación futura cuando se actualice el esquema:
  /*
  try {
    const user = await database.user.findFirst({
      where: {
        stripeCustomerId: customerId,
      },
    });
    return user;
  } catch (error) {
    console.error('Error al buscar usuario por customerId:', error);
    return null;
  }
  */
};

const handleCheckoutSessionCompleted = async (
  data: Stripe.Checkout.Session
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === 'string' ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics.capture({
    event: 'User Subscribed',
    distinctId: user.id,
  });
};

const handleSubscriptionScheduleCanceled = async (
  data: Stripe.SubscriptionSchedule
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === 'string' ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics.capture({
    event: 'User Unsubscribed',
    distinctId: user.id,
  });
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Not configured', ok: false });
  }

  try {
    const body = await request.text();
    const headerPayload = await headers();
    const signature = headerPayload.get('stripe-signature');

    if (!signature) {
      throw new Error('missing stripe-signature header');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      return NextResponse.json(
        { message: 'Webhook error', ok: false },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }
      case 'subscription_schedule.canceled': {
        await handleSubscriptionScheduleCanceled(event.data.object);
        break;
      }
      default: {
        log.warn(`Unhandled event type ${event.type}`);
      }
    }

    await analytics.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    log.error(message);

    return NextResponse.json(
      {
        message: 'something went wrong',
        ok: false,
      },
      { status: 500 }
    );
  }
};
