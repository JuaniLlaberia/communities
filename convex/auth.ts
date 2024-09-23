import { MutationCtx, QueryCtx } from './_generated/server';

export const isAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) return null;

  const user = await ctx.db
    .query('users')
    .withIndex('by_email', q => q.eq('email', identity.email as string))
    .first();

  if (!user) return null;
  else return user;
};
