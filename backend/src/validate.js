'use strict';

const { ApiError } = require('./errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Ensure the request body is a JSON object (never a string/array/null). */
function requireObjectBody(body) {
  if (!isPlainObject(body)) {
    throw ApiError.badRequest('Request body must be a JSON object.');
  }
  return body;
}

function str(value, field, { min = 0, max = 500, required = true, trim = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw ApiError.badRequest(`${field} must be a string.`);
  const out = trim ? value.trim() : value;
  if (out.length < min) {
    throw ApiError.badRequest(`${field} must be at least ${min} characters.`);
  }
  if (out.length > max) {
    throw ApiError.badRequest(`${field} must be at most ${max} characters.`);
  }
  return out;
}

function email(value, field = 'email') {
  const out = str(value, field, { min: 3, max: 254 });
  if (!EMAIL_RE.test(out)) throw ApiError.badRequest('Please provide a valid email address.');
  return out.toLowerCase();
}

function number(value, field, { min, max, required = true, integer = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest(`${field} is required.`);
    return undefined;
  }
  const out = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(out)) throw ApiError.badRequest(`${field} must be a number.`);
  if (integer && !Number.isInteger(out)) {
    throw ApiError.badRequest(`${field} must be a whole number.`);
  }
  if (min !== undefined && out < min) {
    throw ApiError.badRequest(`${field} must be at least ${min}.`);
  }
  if (max !== undefined && out > max) {
    throw ApiError.badRequest(`${field} must be at most ${max}.`);
  }
  return out;
}

function oneOf(value, field, allowed, { required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest(`${field} must be one of: ${allowed.join(', ')}.`);
    return fallback;
  }
  const match = allowed.find((candidate) => candidate.toLowerCase() === String(value).toLowerCase());
  if (!match) throw ApiError.badRequest(`${field} must be one of: ${allowed.join(', ')}.`);
  return match;
}

function stringArray(value, field, { max = 50 } = {}) {
  if (value === undefined || value === null || value === '') return [];
  const arr = Array.isArray(value) ? value : [value];
  if (arr.length > max) throw ApiError.badRequest(`${field} has too many entries.`);
  return arr.map((item) => {
    if (typeof item !== 'string') throw ApiError.badRequest(`${field} entries must be strings.`);
    return item.trim();
  }).filter(Boolean);
}

/** Deny control characters and angle brackets to blunt stored-XSS attempts. */
function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function isoDate(value, field, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest(`${field} is required.`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${field} must be a valid ISO date.`);
  }
  return date;
}

function positiveIntQuery(value, field, { fallback, min = 1, max = 100 } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const out = Number(value);
  if (!Number.isInteger(out) || out < min || out > max) {
    throw ApiError.badRequest(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return out;
}

module.exports = {
  requireObjectBody,
  str,
  email,
  number,
  oneOf,
  stringArray,
  sanitizeText,
  isoDate,
  positiveIntQuery,
  isPlainObject,
};
