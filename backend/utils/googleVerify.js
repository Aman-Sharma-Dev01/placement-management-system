const crypto = require('crypto');
const https = require('https');

const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const CLOCK_SKEW_SECONDS = 60;
const JWKS_TTL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;

let jwksCache = { keys: null, fetchedAt: 0 };

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT_MS }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Google responded with status ${response.statusCode}`));
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Google returned a malformed response'));
        }
      });
    });

    request.on('timeout', () => request.destroy(new Error('Request to Google timed out')));
    request.on('error', reject);
  });

const getGooglePublicKeys = async () => {
  if (jwksCache.keys && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  const data = await fetchJson(JWKS_URI);
  jwksCache = {
    keys: Array.isArray(data.keys) ? data.keys : [],
    fetchedAt: Date.now(),
  };
  return jwksCache.keys;
};

const decodeSegment = (segment) =>
  JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

// Verifies a Google ID token fully offline against Google's published
// signing keys: RS256 signature, audience, issuer and expiry. Nothing in
// the payload is trusted until the signature check passes.
const verifyGoogleIdToken = async (idToken, clientId) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google credential is required');
  }
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Google credential');
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;

  let header;
  try {
    header = decodeSegment(headerSegment);
  } catch {
    throw new Error('Malformed Google credential');
  }

  if (header.alg !== 'RS256') {
    throw new Error('Unexpected Google credential algorithm');
  }

  const keys = await getGooglePublicKeys();
  const jwk = keys.find((key) => key.kid === header.kid && (!key.alg || key.alg === 'RS256'));

  if (!jwk) {
    throw new Error('Google signing key not found');
  }

  const signatureValid = crypto
    .createVerify('RSA-SHA256')
    .update(`${headerSegment}.${payloadSegment}`)
    .verify(
      crypto.createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(signatureSegment, 'base64url')
    );

  if (!signatureValid) {
    throw new Error('Google credential signature is invalid');
  }

  let claims;
  try {
    claims = decodeSegment(payloadSegment);
  } catch {
    throw new Error('Malformed Google credential');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (claims.aud !== clientId) {
    throw new Error('Google credential was issued for a different application');
  }
  if (!VALID_ISSUERS.includes(claims.iss)) {
    throw new Error('Google credential was not issued by Google');
  }
  if (!claims.exp || claims.exp + CLOCK_SKEW_SECONDS < nowSeconds) {
    throw new Error('Google credential has expired');
  }
  if (claims.email_verified === false) {
    throw new Error('Google email address is not verified');
  }
  if (!claims.sub || !claims.email) {
    throw new Error('Google credential is missing account details');
  }

  return {
    sub: claims.sub,
    email: claims.email.toLowerCase().trim(),
    name: claims.name || claims.email.split('@')[0],
    picture: claims.picture || '',
  };
};

module.exports = { verifyGoogleIdToken, _resetJwksCache: () => { jwksCache = { keys: null, fetchedAt: 0 }; } };