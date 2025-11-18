'use client';

import { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt, type ZegoCloudRoomConfig } from '@zegocloud/zego-uikit-prebuilt';
import { useZegoKitToken } from '../hooks/useZegoKitToken';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type ScenarioMode =
  | typeof ZegoUIKitPrebuilt.VideoConference
  | typeof ZegoUIKitPrebuilt.OneONoneCall
  | typeof ZegoUIKitPrebuilt.GroupCall;

interface TokenRequestOptions {
  canPublish?: boolean;
  canLogin?: boolean;
  streamIds?: string[];
  metadata?: Record<string, unknown>;
  expiresInSeconds?: number;
}

export interface VideoCallContainerProps {
  className?: string;
  roomId: string;
  userId: string;
  userName: string;
  scenarioMode?: ScenarioMode;
  config?: Omit<ZegoCloudRoomConfig, 'container'>;
  onLeaveRoom?: () => void;
  onError?: (error: Error) => void;
  kitToken?: string;
  tokenRequestOptions?: TokenRequestOptions;
}

export function VideoCallContainer({
  className,
  roomId,
  userId,
  userName,
  scenarioMode = ZegoUIKitPrebuilt.VideoConference,
  config,
  onLeaveRoom,
  onError,
  kitToken: kitTokenProp,
  tokenRequestOptions,
}: VideoCallContainerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ReturnType<typeof ZegoUIKitPrebuilt.create> | null>(null);
  const activeTokenRef = useRef<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  const {
    canPublish = true,
    canLogin = true,
    streamIds,
    metadata,
    expiresInSeconds,
  } = tokenRequestOptions || {};

  const tokenQuery = useZegoKitToken({
    roomId,
    userId,
    userName,
    canPublish,
    canLogin,
    streamIds,
    metadata,
    expiresInSeconds,
    enabled: !kitTokenProp,
  });

  const kitToken = kitTokenProp ?? tokenQuery.data?.token ?? null;
  const isLoadingToken = !kitTokenProp && tokenQuery.isLoading;
  const tokenError = !kitTokenProp ? tokenQuery.error : null;

  useEffect(() => {
    if (!kitToken) {
      return;
    }

    if (kitToken === activeTokenRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    activeTokenRef.current = kitToken;

    instanceRef.current?.destroy();

    try {
      const uiKit = ZegoUIKitPrebuilt.create(kitToken);
      instanceRef.current = uiKit;

      const {
        onLeaveRoom: configLeaveHandler,
        scenario: configScenario,
        ...restConfig
      } = config || {};

      uiKit.joinRoom({
        container,
        sharedLinks: [],
        showLeavingView: false,
        showRoomDetailsButton: false,
        showTextChat: false,
        showUserList: false,
        autoHideFooter: true,
        scenario: {
          ...configScenario,
          mode: scenarioMode,
        },
        onLeaveRoom: () => {
          configLeaveHandler?.();
          onLeaveRoom?.();
        },
        ...restConfig,
      });

      setInitialised(true);
    } catch (error) {
      console.error('[ZegoCloud] Failed to join room', error);
      instanceRef.current = null;
      activeTokenRef.current = null;
      onError?.(error as Error);
    }

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      activeTokenRef.current = null;
      setInitialised(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitToken, scenarioMode]);

  useEffect(() => {
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      activeTokenRef.current = null;
    };
  }, []);

  if (isLoadingToken) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground',
          className
        )}
      >
        {t('video.connecting')}
      </div>
    );
  }

  if (tokenError) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-4 text-center text-sm text-destructive',
          className
        )}
      >
        <p>{tokenError instanceof Error ? tokenError.message : t('video.unableToStart')}</p>
        <Button size="sm" variant="outline" onClick={() => tokenQuery.refetch()}>
          {t('video.tryAgain')}
        </Button>
      </div>
    );
  }

  if (!kitToken) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive',
          className
        )}
      >
        {t('video.notConfigured')}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-lg border border-border bg-background',
        className,
        initialised ? 'opacity-100' : 'opacity-0 transition-opacity duration-300'
      )}
    />
  );
}

export type { ScenarioMode };
