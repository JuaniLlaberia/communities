import { defineSchema } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';

const statusEnum = v.union(v.literal('active'), v.literal('innactive'));
const messageTypeEnum = v.union(
  v.literal('text'),
  v.literal('image'),
  v.literal('poll')
);
const durationEnum = v.union(
  v.literal('1h'),
  v.literal('4h'),
  v.literal('8h'),
  v.literal('24h'),
  v.literal('3d'),
  v.literal('1w')
);

export const Users = Table('users', {
  fullName: v.string(),
  email: v.string(),
  profileImage: v.optional(v.string()),
  clerkIdentifier: v.string(),
  stripeId: v.optional(v.string()),
});

export const Communities = Table('communities', {
  name: v.string(),
  description: v.string(),
  image_url: v.string(),
  membersCount: v.number(),
  status: statusEnum,
  privacy: v.union(v.literal('private'), v.literal('public')),
  domain: v.string(),
  theme: v.object({
    primaryColorBg: v.string(),
    secondaryColorBg: v.string(),
    actionColor: v.string(),
    primaryColorText: v.string(),
    secondaryColorText: v.string(),
  }),
  features: v.array(
    v.object({
      title: v.string(),
      description: v.string(),
      icon: v.string(),
      order: v.number(),
    })
  ),
  creator: v.id('users'),
  stripeId: v.string(),
});

export const Threads = Table('threads', {
  text: v.string(),
  imageUrl: v.optional(v.string()),
  userId: v.id('users'),
  communityId: v.id('communities'),
  likes: v.array(v.id('users')),
});

export const Events = Table('events', {
  title: v.string(),
  description: v.string(),
  url: v.string(),
  imageUrl: v.optional(v.string()),
  dateInterval: v.object({
    startDate: v.number(),
    endDate: v.optional(v.number()),
  }),
  userId: v.id('users'),
  communityId: v.id('communities'),
  interestedUsers: v.array(v.id('users')),
});

export const Channels = Table('channels', {
  name: v.string(),
  icon: v.string(),
  status: statusEnum,
  allowsWritting: v.boolean(),
  communityId: v.id('communities'),
});

export const Messages = Table('messages', {
  //Common (all) messages fields
  message: v.string(),
  type: messageTypeEnum,
  communityId: v.id('communities'),
  channelId: v.id('channels'),
  userId: v.id('users'),
  isEdited: v.boolean(),
  isResponse: v.boolean(),
  parentMessage: v.id('messages'),
  //Images messages fields
  imageUrl: v.optional(v.string()),
  //Poll message fields
  question: v.optional(v.string()),
  options: v.optional(
    v.array(
      v.object({
        text: v.string(),
        quantity: v.number(),
        votes: v.array(v.id('users')),
      })
    )
  ),
  allowsMultiAnswer: v.optional(v.boolean()),
  duration: durationEnum,
});

export const Plans = Table('plans', {
  name: v.string(),
  description: v.optional(v.string()),
  price: v.number(),
  interval: v.union(v.literal('week'), v.literal('month'), v.literal('year')),
  stripePlanId: v.string(),
  communityId: v.id('communities'),
});

export const Suscriptions = Table('suscriptions', {
  userId: v.id('users'),
  communityId: v.id('communities'),
  planId: v.id('plans'),
  stripeSuscriptionId: v.string(),
  isActive: v.boolean(),
});

export default defineSchema({
  users: Users.table
    .index('by_clerkId', ['clerkIdentifier'])
    .index('by_email', ['email']),
  communities: Communities.table,
  threads: Threads.table
    .index('by_communityId', ['communityId'])
    .index('by_userId', ['userId']),
  events: Events.table
    .index('by_communityId', ['communityId'])
    .index('by_date', ['dateInterval.startDate']),
  channels: Channels.table.index('by_communityId', ['communityId']),
  messages: Messages.table
    .index('by_channel', ['channelId'])
    .index('by_community', ['communityId']),
  plans: Plans.table.index('by_communityId', ['communityId']),
  suscriptions: Suscriptions.table
    .index('by_userId', ['userId'])
    .index('by_planId', ['planId']),
});
