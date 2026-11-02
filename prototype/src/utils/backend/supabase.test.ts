import { describe, expect, it } from 'vitest';
import { friendlyError } from './supabase';

describe('friendlyError', () => {
  it.each([
    ['email rate limit exceeded', /sign-up emails.*try again later/],
    ['Request rate limit reached', /wait a moment/],
    ['Too many requests', /wait a moment/],
    ['Invalid login credentials', /email or password is not correct/],
    ['User already registered', /already has an account/],
  ])('explains "%s"', (message, expected) => {
    expect(friendlyError({ message })).toMatch(expected);
  });
});
