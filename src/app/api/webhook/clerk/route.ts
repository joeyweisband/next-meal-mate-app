import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

// This is your Clerk webhook secret
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Verify the webhook signature
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  // If there is no webhook secret, or no signature headers, return 400
  if (!webhookSecret || !svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing webhook verification data' }, { status: 400 });
  }

  // Create a new Svix instance with your secret
  const webhook = new Webhook(webhookSecret);
  let evt: any;

  try {
    // Verify the payload with the headers
    evt = webhook.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
  }

  // Get the event type
  const { type } = evt;
  const eventData = evt.data;

  console.log(`Webhook event received: ${type}`);

  // Handle user creation event
  if (type === 'user.created') {
    try {
      // Initialize database connection
      await initializeDatabase();

      // Use upsert to avoid duplicate errors if user already exists
      await prisma.user.upsert({
        where: { id: eventData.id },
        update: {}, // No updates if exists
        create: {
          id: eventData.id,
          clerkId: eventData.id,
          name: eventData.first_name && eventData.last_name 
            ? `${eventData.first_name} ${eventData.last_name}`
            : eventData.username || 'New User',
          email: eventData.email_addresses[0]?.email_address || '',
          onboarding_completed: false,
        },
      });

      console.log(`User created in database: ${eventData.id}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error creating user in database:', error);
      return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
  }

  // Return a 200 response for all other event types
  return NextResponse.json({ success: true });
}
