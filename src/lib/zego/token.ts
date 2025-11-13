import { createCipheriv, randomBytes } from 'crypto';

const enum PrivilegeKey {
  Login = 1,
  Publish = 2,
}

type PrivilegeValue = 0 | 1;

export interface TokenPayload {
  room_id?: string;
  privilege?: Partial<Record<PrivilegeKey, PrivilegeValue>>;
  stream_id_list?: string[];
  // allow future custom fields from ZEGO
  [key: string]: unknown;
}

class TokenGenerationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'APP_ID_INVALID'
      | 'USER_ID_INVALID'
      | 'SECRET_INVALID'
      | 'EFFECTIVE_TIME_INVALID'
      | 'PAYLOAD_INVALID'
  ) {
    super(message);
    this.name = 'TokenGenerationError';
  }
}

function makeNonce(): number {
  const min = -2147483648;
  const max = 2147483647;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveAlgorithm(secret: Buffer): string {
  switch (secret.length) {
    case 16:
      return 'aes-128-cbc';
    case 24:
      return 'aes-192-cbc';
    case 32:
      return 'aes-256-cbc';
    default:
      throw new TokenGenerationError('Secret must be 16, 24, or 32 bytes long', 'SECRET_INVALID');
  }
}

function aesEncrypt(plainText: string, secret: Buffer, iv: Buffer): ArrayBuffer {
  const algo = resolveAlgorithm(secret);
  const cipher = createCipheriv(algo, secret, iv);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return Uint8Array.from(encrypted).buffer;
}

export interface GenerateTokenParams {
  appId: number;
  userId: string;
  secret: string;
  effectiveTimeInSeconds: number;
  payload?: TokenPayload | string | null;
}

export function generateToken({
  appId,
  userId,
  secret,
  effectiveTimeInSeconds,
  payload,
}: GenerateTokenParams): string {
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new TokenGenerationError('appId must be a positive number', 'APP_ID_INVALID');
  }

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new TokenGenerationError('userId must be a non-empty string', 'USER_ID_INVALID');
  }

  if (typeof secret !== 'string' || secret.trim().length === 0) {
    throw new TokenGenerationError('secret must be a non-empty string', 'SECRET_INVALID');
  }

  const secretBuffer = Buffer.from(secret);
  if (![16, 24, 32].includes(secretBuffer.length)) {
    throw new TokenGenerationError('secret must resolve to 16, 24, or 32 bytes', 'SECRET_INVALID');
  }

  if (!Number.isFinite(effectiveTimeInSeconds) || effectiveTimeInSeconds <= 0) {
    throw new TokenGenerationError(
      'effectiveTimeInSeconds must be a positive number',
      'EFFECTIVE_TIME_INVALID'
    );
  }

  let payloadString = '';
  if (payload) {
    if (typeof payload === 'string') {
      payloadString = payload;
    } else {
      try {
        payloadString = JSON.stringify(payload);
      } catch (_error) {
        throw new TokenGenerationError('payload must be JSON serialisable', 'PAYLOAD_INVALID');
      }
    }
  }

  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const expireAt = currentTimeSeconds + Math.floor(effectiveTimeInSeconds);

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: makeNonce(),
    ctime: currentTimeSeconds,
    expire: expireAt,
    payload: payloadString,
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = randomBytes(16);
  const encryptedBuffer = aesEncrypt(plainText, secretBuffer, iv);

  const expiryBuf = Buffer.allocUnsafe(8);
  expiryBuf.writeBigInt64BE(BigInt(expireAt));

  const ivLengthBuf = Buffer.allocUnsafe(2);
  ivLengthBuf.writeUInt16BE(iv.length);

  const encryptedLengthBuf = Buffer.allocUnsafe(2);
  encryptedLengthBuf.writeUInt16BE(encryptedBuffer.byteLength);

  const tokenBinary = Buffer.concat([
    expiryBuf,
    ivLengthBuf,
    iv,
    encryptedLengthBuf,
    Buffer.from(encryptedBuffer),
  ]);

  return `04${tokenBinary.toString('base64')}`;
}

export function buildPrivilegePayload({
  roomId,
  canLogin = true,
  canPublish = true,
  streamIds,
  extra,
}: {
  roomId?: string | null;
  canLogin?: boolean;
  canPublish?: boolean;
  streamIds?: string[] | null;
  extra?: Record<string, unknown>;
} = {}): TokenPayload {
  const privilege: TokenPayload['privilege'] = {};
  privilege[PrivilegeKey.Login] = canLogin ? 1 : 0;
  privilege[PrivilegeKey.Publish] = canPublish ? 1 : 0;

  const payload: TokenPayload = {
    privilege,
  };

  if (roomId) {
    payload.room_id = roomId;
  }

  if (streamIds && streamIds.length > 0) {
    payload.stream_id_list = streamIds;
  }

  if (extra && Object.keys(extra).length > 0) {
    Object.assign(payload, extra);
  }

  return payload;
}

export { TokenGenerationError };
