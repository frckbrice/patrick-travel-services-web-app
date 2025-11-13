import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UseZegoKitTokenParams {
  roomId: string;
  userId: string;
  userName: string;
  canPublish?: boolean;
  canLogin?: boolean;
  streamIds?: string[];
  metadata?: Record<string, unknown>;
  expiresInSeconds?: number;
  enabled?: boolean;
}

interface TokenResponse {
  token: string;
  appId: number;
  userId: string;
  roomId: string;
  expiresAt: string;
  issuedAt: string;
  durationSeconds: number;
}

interface ApiResponse {
  success: boolean;
  data: TokenResponse;
  error?: string;
}

export function useZegoKitToken({
  roomId,
  userId,
  userName,
  canPublish = true,
  canLogin = true,
  streamIds,
  metadata,
  expiresInSeconds,
  enabled = true,
}: UseZegoKitTokenParams) {
  const metadataKey = useMemo(() => (metadata ? JSON.stringify(metadata) : undefined), [metadata]);
  const streamKey = useMemo(() => (streamIds ? streamIds.join(',') : undefined), [streamIds]);

  return useQuery<TokenResponse>({
    queryKey: [
      'zego-kit-token',
      roomId,
      userId,
      canPublish,
      canLogin,
      streamKey,
      metadataKey,
      expiresInSeconds,
    ],
    enabled: enabled && Boolean(roomId && userId && userName),
    staleTime: Math.max((expiresInSeconds ?? 60) * 1000 - 30_000, 30_000),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const body = {
        roomId,
        canPublish,
        canLogin,
        streamIds,
        metadata: {
          requestedBy: userId,
          requestedByName: userName,
          ...metadata,
        },
        expiresInSeconds,
      };

      const response = await fetch('/api/video/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch video token';
        try {
          const payload = (await response.json()) as ApiResponse;
          if (payload?.error) {
            errorMessage = payload.error;
          }
        } catch (error) {
          console.warn('Failed to parse token error payload', error);
        }
        throw new Error(errorMessage);
      }

      const payload = (await response.json()) as ApiResponse;

      if (!payload?.success || !payload?.data?.token) {
        throw new Error(payload?.error || 'Invalid response from video token service');
      }

      return payload.data;
    },
  });
}
