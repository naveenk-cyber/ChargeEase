'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, signup } = require('./helpers');

const futureIso = (minutesFromNow) => new Date(Date.now() + minutesFromNow * 60000).toISOString();

function bookingPayload(overrides = {}) {
  return {
    stationId: 'st-001',
    connectorType: 'CCS',
    startTime: futureIso(60),
    durationMinutes: 60,
    ...overrides,
  };
}

test('creates a booking with an estimated cost and marks it simulated', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const res = await client.post('/bookings', bookingPayload(), { token });
  assert.equal(res.status, 201);
  const { booking } = res.body.data;
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.simulated, true);
  assert.ok(booking.totalCost > 0, 'estimate should be positive');
  assert.equal(booking.station.id, 'st-001');
  assert.match(res.body.data.note, /no real station reservation/i);
});

test('rejects a connector the station does not offer', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const res = await client.post(
    '/bookings',
    bookingPayload({ stationId: 'st-003', connectorType: 'CCS' }),
    { token },
  );
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /does not offer/i);
});

test('rejects bookings in the past and out-of-range durations', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const past = await client.post(
    '/bookings',
    bookingPayload({ startTime: futureIso(-120) }),
    { token },
  );
  assert.equal(past.status, 400);

  const tooShort = await client.post('/bookings', bookingPayload({ durationMinutes: 5 }), { token });
  assert.equal(tooShort.status, 400);
});

test('prevents overlapping bookings on the same connector', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const first = await client.post('/bookings', bookingPayload(), { token });
  assert.equal(first.status, 201);

  // Same window, different user — still a conflict because hardware is shared.
  const other = await signup(client);
  const overlap = await client.post('/bookings', bookingPayload({ startTime: futureIso(90) }), {
    token: other.token,
  });
  assert.equal(overlap.status, 409);
  assert.equal(overlap.body.error.code, 'CONFLICT');

  // Non-overlapping window on the same connector is allowed.
  const later = await client.post(
    '/bookings',
    bookingPayload({ startTime: futureIso(180), durationMinutes: 30 }),
    { token: other.token },
  );
  assert.equal(later.status, 201);

  // A different connector at the same time is allowed.
  const otherConnector = await client.post(
    '/bookings',
    bookingPayload({ connectorType: 'CHAdeMO' }),
    { token: other.token },
  );
  assert.equal(otherConnector.status, 201);
});

test('bookings are scoped to the owner', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());

  const alice = await signup(client);
  const bob = await signup(client);

  const created = await client.post('/bookings', bookingPayload(), { token: alice.token });
  const id = created.body.data.booking.id;

  const bobRead = await client.get(`/bookings/${id}`, { token: bob.token });
  assert.equal(bobRead.status, 403, 'another user must not read the booking');

  const bobCancel = await client.post(`/bookings/${id}/cancel`, undefined, { token: bob.token });
  assert.equal(bobCancel.status, 403, 'another user must not cancel the booking');

  const aliceRead = await client.get(`/bookings/${id}`, { token: alice.token });
  assert.equal(aliceRead.status, 200);
});

test('cancellation is a valid state transition', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const created = await client.post('/bookings', bookingPayload(), { token });
  const id = created.body.data.booking.id;

  const cancelled = await client.post(`/bookings/${id}/cancel`, undefined, { token });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.data.booking.status, 'cancelled');

  const again = await client.post(`/bookings/${id}/cancel`, undefined, { token });
  assert.equal(again.status, 409, 'a cancelled booking cannot be cancelled twice');

  // A cancelled slot no longer blocks the connector.
  const reuse = await client.post('/bookings', bookingPayload(), { token });
  assert.equal(reuse.status, 201);
});

test('starting an unconfirmed booking is rejected', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const created = await client.post('/bookings', bookingPayload(), { token });
  const id = created.body.data.booking.id;
  await client.post(`/bookings/${id}/cancel`, undefined, { token });

  const start = await client.post(`/bookings/${id}/start`, undefined, { token });
  assert.equal(start.status, 409);
});

test('full session lifecycle debits the wallet and records history', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  // Give the wallet enough simulated balance to cover the session.
  await client.post('/users/wallet/topup', { amountMinor: 2000 }, { token });

  const created = await client.post('/bookings', bookingPayload(), { token });
  const id = created.body.data.booking.id;

  const started = await client.post(`/bookings/${id}/start`, undefined, { token });
  assert.equal(started.status, 201);
  assert.equal(started.body.data.session.simulated, true);
  assert.equal(started.body.data.session.operatorConfirmed, false);

  const stopped = await client.post(`/bookings/${id}/stop`, undefined, { token });
  assert.equal(stopped.status, 200);
  assert.ok(stopped.body.data.session.energyKwh > 0);
  assert.ok(stopped.body.data.chargingCost > 0);
  assert.equal(stopped.body.data.charged, true);

  const booking = await client.get(`/bookings/${id}`, { token });
  assert.equal(booking.body.data.booking.status, 'completed');

  const history = await client.get('/bookings/history', { token });
  assert.equal(history.body.data.total, 1);
  assert.equal(history.body.data.sessions[0].operatorConfirmed, false);

  // Wallet was debited exactly the session cost.
  const wallet = await client.get('/users/wallet', { token });
  const expected = Math.round((20 - stopped.body.data.chargingCost) * 100);
  assert.equal(wallet.body.data.wallet.balanceMinor, expected);
  assert.equal(wallet.body.data.transactions[0].type, 'charge');
});

test('stopping without funds is refused and leaves the session open', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  const created = await client.post('/bookings', bookingPayload(), { token });
  const id = created.body.data.booking.id;
  await client.post(`/bookings/${id}/start`, undefined, { token });

  const stopped = await client.post(`/bookings/${id}/stop`, undefined, { token });
  assert.equal(stopped.status, 409);
  assert.match(stopped.body.error.message, /insufficient/i);

  const history = await client.get('/bookings/history', { token });
  assert.equal(history.body.data.total, 0, 'session must not be closed');
});

test('booking list supports status filters and pagination', async (t) => {
  const client = await startTestServer();
  t.after(() => client.close());
  const { token } = await signup(client);

  await client.post('/bookings', bookingPayload({ startTime: futureIso(30) }), { token });
  const second = await client.post(
    '/bookings',
    bookingPayload({ startTime: futureIso(300), durationMinutes: 30 }),
    { token },
  );
  assert.equal(second.status, 201);
  await client.post(`/bookings/${second.body.data.booking.id}/cancel`, undefined, { token });

  const upcoming = await client.get('/bookings?status=upcoming', { token });
  assert.ok(upcoming.body.data.bookings.every((b) => new Date(b.startTime) > new Date()));

  const all = await client.get('/bookings?limit=1&page=1', { token });
  assert.equal(all.body.data.bookings.length, 1);
  assert.equal(all.body.data.hasMore, true);

  const cancelled = await client.get('/bookings?status=cancelled', { token });
  assert.equal(cancelled.body.data.total, 1);
});
