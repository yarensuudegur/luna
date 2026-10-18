import { useCallback, useEffect, useState } from 'react';
import { trAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

const COOLDOWN = 60;

/** Doğrulama e-postasını tekrar gönderir; art arda gönderimi 60 sn bekletir. */
export function useResendConfirmation(email: string) {
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = useCallback(async () => {
    if (!email || busy || cooldown > 0) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setMessage(trAuthError(error.message));
    else {
      setMessage('Doğrulama bağlantısını tekrar gönderdik.');
      setCooldown(COOLDOWN);
    }
    setBusy(false);
  }, [email, busy, cooldown]);

  return { resend, cooldown, busy, message };
}
