import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'failed';

type WebNavigator = {
  share?: (data: { text: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

/**
 * Metni paylaşır. Telefonda sistem paylaşım menüsü açılır. Web'de tarayıcı
 * paylaşımı destekliyorsa o, desteklemiyorsa metin panoya kopyalanır.
 */
export async function shareText(message: string): Promise<ShareResult> {
  if (Platform.OS !== 'web') {
    try {
      await Share.share({ message });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
  const nav = (globalThis as { navigator?: WebNavigator }).navigator;
  if (nav?.share) {
    try {
      await nav.share({ text: message });
      return 'shared';
    } catch (e) {
      // Kullanıcı menüyü kapattıysa sessizce geç; başka hatada panoya düş.
      if (e instanceof Error && e.name === 'AbortError') return 'shared';
    }
  }
  if (nav?.clipboard) {
    try {
      await nav.clipboard.writeText(message);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  return 'failed';
}

/** shareText + "kopyalandı" durumu (2 sn). Buton etiketi `copied` iken değiştirilir. */
export function useShare(): { share: (message: string) => void; copied: boolean } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const share = useCallback((message: string) => {
    void shareText(message).then((r) => {
      if (r !== 'copied') return;
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    });
  }, []);
  return { share, copied };
}
