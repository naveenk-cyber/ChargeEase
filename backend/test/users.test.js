'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, signup } = require('./helpers');

test('profile can be read and updated, and rejects invalid values', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const updated = await client.put(
    '/users/profile',
    {
      name: 'Grace Hopper',
      phone: '+1 555 9999',
      preferences: { units: 'metric', language: 'en', notifications: { push: true } },
    },
    { token },
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.user.name, 'Grace Hopper');
  assert.equal(updated.body.data.user.preferences.units, 'metric');
  assert.equal(updated.body.data.user.preferences.notifications.push, true);

  const invalid = await client.put('/users/profile', { name: 'x' }, { token });
  assert.equal(invalid.status, 400);

  const badUnits = await client.put('/users/profile', { preferences: { units: 'parsecs' } }, { token });
  assert.equal(badUnits.status, 400);
});

test('vehicles are created, updated, and scoped to the owner', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());

  const alice = await signup(client);
  const bob = await signup(client);

  const created = await client.post(
    '/users/vehicles',
    {
      make: 'Demo',
      model: 'Roadster',
      year: 2024,
      batteryCapacity: 82,
      connectorTypes: ['CCS', 'Type 2', 'NotAConnector'],
      estimatedRange: 500,
      isDefault: true,
    },
    { token: alice.token },
  );
  assert.equal(created.status, 201);
  const vehicle = created.body.data.vehicle;
  // Unknown connector types are dropped rather than stored.
  assert.deepEqual(vehicle.connectorTypes, ['CCS', 'Type 2']);

  const list = await client.get('/users/vehicles', { token: alice.token });
  assert.equal(list.body.data.vehicles.length, 1);

  const bobUpdate = await client.put(
    `/users/vehicles/${vehicle.id}`,
    { model: 'Hacked' },
    { token: bob.token },
  );
  assert.equal(bobUpdate.status, 403);

  const bobDelete = await client.delete(`/users/vehicles/${vehicle.id}`, { token: bob.token });
  assert.equal(bobDelete.status, 403);

  const updated = await client.put(
    `/users/vehicles/${vehicle.id}`,
    { model: 'Roadster 2' },
    { token: alice.token },
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.vehicle.model, 'Roadster 2');

  const removed = await client.delete(`/users/vehicles/${vehicle.id}`, { token: alice.token });
  assert.equal(removed.status, 200);
});

test('simulated wallet top-ups are recorded with a consistent ledger', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const before = await client.get('/users/wallet', { token });
  assert.equal(before.body.data.wallet.balanceMinor, 0);
  assert.equal(before.body.data.wallet.simulated, true);
  assert.match(before.body.data.notice, /simulated/i);

  const topup = await client.post('/users/wallet/topup', { amountMinor: 2500 }, { token });
  assert.equal(topup.status, 201);
  assert.equal(topup.body.data.wallet.balanceMinor, 2500);
  assert.equal(topup.body.data.transaction.amount, 25);
  assert.equal(topup.body.data.transaction.balanceAfter, 25);
  assert.equal(topup.body.data.transaction.simulated, true);
  assert.match(topup.body.data.notice, /no real payment/i);

  const second = await client.post('/users/wallet/topup', { amountMinor: 500 }, { token });
  assert.equal(second.body.data.wallet.balanceMinor, 3000);

  const ledger = await client.get('/users/wallet/transactions', { token });
  assert.equal(ledger.body.data.total, 2);
  // Newest first, running balance must match after each entry.
  assert.equal(ledger.body.data.transactions[0].balanceAfter, 30);
  assert.equal(ledger.body.data.transactions[1].balanceAfter, 25);
});

test('wallet top-up validates bounds and isolates users', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());

  const alice = await signup(client);
  const bob = await signup(client);

  const tooSmall = await client.post('/users/wallet/topup', { amountMinor: 10 }, { token: alice.token });
  assert.equal(tooSmall.status, 400);

  const tooLarge = await client.post(
    '/users/wallet/topup',
    { amountMinor: 99999999 },
    { token: alice.token },
  );
  assert.equal(tooLarge.status, 400);

  await client.post('/users/wallet/topup', { amountMinor: 1000 }, { token: alice.token });
  const bobWallet = await client.get('/users/wallet', { token: bob.token });
  assert.equal(bobWallet.body.data.wallet.balanceMinor, 0, 'bob must not see alice funds');
  assert.equal(bobWallet.body.data.transactions.length, 0);
});

test('analytics are computed from stored records, not hardcoded', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const empty = await client.get('/users/analytics', { token });
  assert.equal(empty.body.data.analytics.totalSessions, 0);
  assert.equal(empty.body.data.analytics.totalEnergyConsumed, 0);
  assert.deepEqual(empty.body.data.analytics.monthlyUsage, []);
  assert.match(empty.body.data.notice, /estimates/i);

  await client.post('/users/wallet/topup', { amountMinor: 5000 }, { token });
  const booking = await client.post(
    '/bookings',
    {
      stationId: 'st-001',
      connectorType: 'CCS',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      durationMinutes: 60,
    },
    { token },
  );
  const id = booking.body.data.booking.id;
  await client.post(`/bookings/${id}/start`, undefined, { token });
  await client.post(`/bookings/${id}/stop`, undefined, { token });

  const after = await client.get('/users/analytics', { token });
  assert.equal(after.body.data.analytics.totalSessions, 1);
  assert.ok(after.body.data.analytics.totalEnergyConsumed > 0);
  assert.ok(after.body.data.analytics.totalCost > 0);
  assert.equal(after.body.data.analytics.monthlyUsage.length, 1);
});

test('unauthenticated access to user data is denied', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());

  for (const path of ['/users/profile', '/users/wallet', '/users/vehicles', '/users/analytics', '/users/favorites']) {
    const res = await client.get(path);
    assert.equal(res.status, 401, `${path} must require authentication`);
  }
});
