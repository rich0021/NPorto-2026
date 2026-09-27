"use client";

import { useEffect, useState } from "react";

// Live wall-clock time in a given zone. Renders a placeholder on the server
// so the markup matches on hydration, then ticks every second.
export function LocalTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
    const tick = () => setTime(format.format(new Date()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [timeZone]);

  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}
