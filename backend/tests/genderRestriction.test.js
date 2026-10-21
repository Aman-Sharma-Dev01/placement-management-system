/**
 * Gender-restricted placement drives.
 *
 * Covers the two pure helpers that decide who is allowed to see a drive:
 * the sanitiser that normalises the gender allow-list coming from the client
 * and the Mongo filter that hides a restricted drive from other genders.
 *
 *   node --test tests/
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeGenders } = require('../controllers/drive.controller');
const { genderVisibilityFilter } = require('../services/eligibilityService');

test('sanitizeGenders: an empty or missing list means "open to everybody"', () => {
  assert.deepEqual(sanitizeGenders([]), []);
  assert.deepEqual(sanitizeGenders(undefined), []);
  assert.deepEqual(sanitizeGenders(null), []);
  assert.deepEqual(sanitizeGenders('Female'), []);
});

test('sanitizeGenders: unknown genders are dropped and duplicates collapsed', () => {
  assert.deepEqual(sanitizeGenders(['Female', 'female', 'Male', 'Alien']), ['Female', 'Male']);
  assert.deepEqual(sanitizeGenders(['Female', 'Female']), ['Female']);
});

test('genderVisibilityFilter: a student of a gender never sees a drive restricted to another', () => {
  const filter = genderVisibilityFilter('Male');

  // The three ways a drive can be visible to a male student: no gender rule
  // at all, an empty allow-list, or an allow-list that contains "Male".
  assert.equal(filter.$or.length, 3);
  assert.deepEqual(filter.$or[0], { 'eligibility.allowedGenders': { $exists: false } });
  assert.deepEqual(filter.$or[1], { 'eligibility.allowedGenders': { $size: 0 } });
  assert.deepEqual(filter.$or[2], { 'eligibility.allowedGenders': 'Male' });

  // A female-only drive is not matched by any of them.
  const femaleOnly = { 'eligibility.allowedGenders': 'Female' };
  assert.equal(filter.$or.some((clause) => clause['eligibility.allowedGenders'] === femaleOnly['eligibility.allowedGenders']), false);
});

test('genderVisibilityFilter: a student without a gender only sees unrestricted drives', () => {
  const filter = genderVisibilityFilter(null);
  assert.equal(filter.$or.length, 2);
  assert.deepEqual(filter.$or[0], { 'eligibility.allowedGenders': { $exists: false } });
  assert.deepEqual(filter.$or[1], { 'eligibility.allowedGenders': { $size: 0 } });
});
