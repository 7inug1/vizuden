import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';

function readLocalStatus() {
  const prescription = readPrescriptionSaved();

  return {
    prescription: {
      done: Boolean(prescription?.reportId),
      reportId: prescription?.reportId ?? null,
    },
  };
}

export function useReportStatus() {
  const { user, session, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(() => readLocalStatus());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const local = readLocalStatus();
    setStatus(local);

    if (authLoading || !user || !session?.access_token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/report-status', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || cancelled) return;

        setStatus({
          prescription: {
            done: Boolean(data?.prescription?.done || local.prescription.done),
            reportId: data?.prescription?.reportId || local.prescription.reportId || null,
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus(local);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.access_token, user?.id]);

  return useMemo(
    () => ({
      prescription: status.prescription,
      loading: authLoading || loading,
    }),
    [authLoading, loading, status]
  );
}
