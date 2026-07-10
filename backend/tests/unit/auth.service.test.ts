import bcrypt from 'bcryptjs';

// Placeholder tests — full suite added in M4
// These verify core utilities used by the auth service

describe('bcrypt', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await bcrypt.hash('TestPass1', 10);
    expect(await bcrypt.compare('TestPass1', hash)).toBe(true);
    expect(await bcrypt.compare('WrongPass', hash)).toBe(false);
  });
});

describe('environment', () => {
  it('runs in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
