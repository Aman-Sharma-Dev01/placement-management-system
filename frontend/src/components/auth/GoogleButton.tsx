import React, { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

const loadGoogleIdentity = () => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);

    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Could not load Google Sign-In. Check your internet connection.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google Sign-In'));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

type ButtonText = 'signin_with' | 'signup_with' | 'continue_with';

interface GoogleButtonProps {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  text?: ButtonText;
}

type Status = 'loading' | 'ready' | 'unconfigured' | 'error';

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onCredential,
  onError,
  text = 'continue_with',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!CLIENT_ID) {
      setStatus('unconfigured');
      return;
    }

    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'left',
          width: Math.min(400, containerRef.current.offsetWidth || 400),
        });

        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus('error');
        onError?.(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [onCredential, text]);

  if (status === 'unconfigured') {
    return (
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <p className="font-semibold">Google Sign-In is not configured yet.</p>
        <p className="mt-1">
          Add <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> to{' '}
          <code className="font-mono">frontend/.env</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Google Sign-In failed to load — click to retry
      </button>
    );
  }

  return (
    <div className="flex w-full justify-center" aria-busy={status === 'loading'}>
      {status === 'loading' && (
        <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />
      )}
      <div ref={containerRef} className={status === 'loading' ? 'hidden' : ''} />
    </div>
  );
};