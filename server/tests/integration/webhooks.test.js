jest.setTimeout(30000);

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const setupApp = require('../../server');
const { Webhook } = require('svix');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Mock the clerk client since we don't want to make real API calls
jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      updateUser: jest.fn().mockResolvedValue({}),
      deleteUser: jest.fn().mockResolvedValue({}),
    },
  },
}));

let mongoServer;
let app;

// The secret part must be a valid base64 string. 'dGVzdF9zZWNyZXQ=' is the base64 encoding of 'test_secret'.
const WEBHOOK_SECRET = 'whsec_dGVzdF9zZWNyZXQ=';

beforeAll(async () => {
  process.env.CLERK_WEBHOOK_SECRET_LOCAL = WEBHOOK_SECRET; // Set env for the test
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  app = setupApp(null); // Webhook routes don't need our mockAuth
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Clerk Webhook Endpoint', () => {
  it('should handle a user.created event and update user metadata', async () => {
    const newUserId = `user_${new Date().getTime()}`;
    const payload = {
      data: {
        id: newUserId,
        unsafe_metadata: {
          role: 'viewer', // Simulate role being passed during signup
        },
      },
      object: 'event',
      type: 'user.created',
    };

    // Generate a valid signature for the payload
    const wh = new Webhook(WEBHOOK_SECRET);
    const timestamp = new Date();
    const svixHeaders = {};
    svixHeaders['svix-id'] = `msg_${timestamp.getTime()}`;
    svixHeaders['svix-timestamp'] = Math.floor(timestamp.getTime() / 1000).toString();
    svixHeaders['svix-signature'] = wh.sign(svixHeaders['svix-id'], timestamp, JSON.stringify(payload));

    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('svix-id', svixHeaders['svix-id'])
      .set('svix-timestamp', svixHeaders['svix-timestamp'])
      .set('svix-signature', svixHeaders['svix-signature'])
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.text).toBe('Webhook received');

    // Verify that the clerk client was called to update the user's role
    expect(clerkClient.users.updateUser).toHaveBeenCalledWith(newUserId, {
      publicMetadata: { role: 'viewer' },
    });
  });

  it('should handle a user.deleted event', async () => {
    const deletedUserId = `user_${new Date().getTime()}`;
    const payload = {
      data: {
        id: deletedUserId,
        deleted: true,
      },
      object: 'event',
      type: 'user.deleted',
    };

    const wh = new Webhook(WEBHOOK_SECRET);
    const timestamp = new Date();
    const svixHeaders = {};
    svixHeaders['svix-id'] = `msg_${timestamp.getTime()}`;
    svixHeaders['svix-timestamp'] = Math.floor(timestamp.getTime() / 1000).toString();
    svixHeaders['svix-signature'] = wh.sign(svixHeaders['svix-id'], timestamp, JSON.stringify(payload));

    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('svix-id', svixHeaders['svix-id'])
      .set('svix-timestamp', svixHeaders['svix-timestamp'])
      .set('svix-signature', svixHeaders['svix-signature'])
      .send(payload);

    expect(res.status).toBe(200);
    // In a real app, you might check that the user was deleted from your own DB here.
    // For this controller, we just expect it to not throw an error.
  });

  it('should return 400 for an invalid signature', async () => {
    const payload = { data: { id: 'some_id' }, type: 'user.created' };
    const timestamp = new Date();
    const svixHeaders = {
      'svix-id': `msg_${timestamp.getTime()}`,
      'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'svix-signature': 'invalid_signature', // Deliberately invalid
    };

    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(svixHeaders)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 200 for an unhandled event type', async () => {
    const payload = { data: { id: 'some_id' }, type: 'unhandled.event' };
    // A valid signature is still required for the request to be processed
    const wh = new Webhook(WEBHOOK_SECRET);
    const timestamp = new Date(); // Use a consistent timestamp
    const svix_id = `msg_${timestamp.getTime()}`;
    const svix_timestamp = Math.floor(timestamp.getTime() / 1000).toString();
    const svix_signature = wh.sign(svix_id, timestamp, JSON.stringify(payload));

    const res = await request(app).post('/api/webhooks/clerk').set({
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }).send(payload);
    expect(res.status).toBe(200);
  });
});