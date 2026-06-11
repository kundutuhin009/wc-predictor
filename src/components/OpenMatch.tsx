"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Countdown } from "./Countdown";
import { PredictionForm } from "./PredictionForm";

// Client wrapper for an open, not-yet-predicted match: shows the live countdown
// and the form. When the window closes locally, it refreshes so the server
// re-buckets the match into Closed.
export function OpenMatch({
  matchId,
  homeTeam,
  awayTeam,
  kickoffIso,
}: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffIso: string;
}) {
  const router = useRouter();
  const [closed, setClosed] = useState(false);
  const onClose = useCallback(() => {
    setClosed(true);
    router.refresh();
  }, [router]);

  return (
    <div>
      <div className="flex justify-center">
        <Countdown kickoffIso={kickoffIso} onClose={onClose} />
      </div>
      {!closed && (
        <PredictionForm
          matchId={matchId}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}
    </div>
  );
}
