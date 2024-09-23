import { Webhook } from 'svix';
import { httpRouter } from 'convex/server';
import type { WebhookEvent } from '@clerk/backend';

import { httpAction } from './_generated/server';
import { api, internal } from './_generated/api';

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET as string;
const validateClerkRequest = async (request: Request) => {
  const payloadString = await request.text();

  const svixHeaders = {
    'svix-id': request.headers.get('svix-id')!,
    'svix-timestamp': request.headers.get('svix-timestamp')!,
    'svix-signature': request.headers.get('svix-signature')!,
  };
  const wh = new Webhook(clerkWebhookSecret);
  let evt: Event | null = null;
  try {
    evt = wh.verify(payloadString, svixHeaders) as Event;
  } catch (err) {
    console.log('error verifying', err);
    return;
  }

  return evt as unknown as WebhookEvent;
};

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) return new Response('No event was attached', { status: 400 });

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        const { id, first_name, last_name, email_addresses, image_url } =
          event.data;

        const userDB = await ctx.runQuery(api.users.getUserByClerkId, {
          clerkIdentifier: id,
        });

        if (userDB) {
          await ctx.runMutation(internal.users.updateUser, {
            clerkIdentifier: id,
            fullName: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            profileImage: image_url,
          });
        } else {
          await ctx.runMutation(internal.users.createUser, {
            clerkIdentifier: id,
            fullName: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            profileImage: image_url,
          });
        }
        break;
      case 'user.deleted':
        const clerkIdentifier = event.data.id!;
        await ctx.runMutation(internal.users.deleteUser, {
          clerkIdentifier,
        });
        break;
      default:
        console.log('Ignored clerk webhook');
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response('Webhook error', { status: 400 });
  }
});

const http = httpRouter();
http.route({
  path: '/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
});

export default http;
