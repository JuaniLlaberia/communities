import { ConvexError, v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { isAuth } from './auth';
import { Users } from './schema';

export const getUser = query({
  args: {},
  handler: async ctx => {
    const user = await isAuth(ctx);

    if (!user) return null;
    else return user;
  },
});

export const getUserByClerkId = query({
  args: { clerkIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q =>
        q.eq('clerkIdentifier', args.clerkIdentifier)
      )
      .first();

    if (!user) return null;
    else return user;
  },
});

export const createUser = internalMutation({
  args: Users.withoutSystemFields,
  handler: async (ctx, args) => {
    const { fullName, email, profileImage, clerkIdentifier } = args;

    const newUserId = await ctx.db.insert('users', {
      fullName,
      email,
      profileImage,
      clerkIdentifier,
    });

    if (!newUserId) throw new ConvexError('Failed to create user');

    return newUserId;
  },
});

export const updateUser = internalMutation({
  args: Users.withoutSystemFields,
  handler: async (ctx, args) => {
    const { fullName, email, profileImage, clerkIdentifier } = args;

    const user = await getUserByClerkId(ctx, { clerkIdentifier });
    if (!user) throw new ConvexError('User not found');

    await ctx.db.patch(user._id, {
      fullName,
      email,
      profileImage,
    });
  },
});

export const deleteUser = internalMutation({
  args: { clerkIdentifier: Users.withoutSystemFields.clerkIdentifier },
  handler: async (ctx, args) => {
    const { clerkIdentifier } = args;

    const user = await getUserByClerkId(ctx, { clerkIdentifier });
    if (!user) throw new ConvexError('User not found');

    await ctx.db.delete(user._id);
  },
});
