import { useEffect, useState } from "react";

export function useTicker(timeout: number) {
  const [now, setNow] = useState<Date>();

  useEffect(() => {
    const cb = () => setNow(new Date());
    cb();
    const intervalId = window.setInterval(cb, timeout);

    return () => window.clearInterval(intervalId);
  }, [timeout]);

  return now;
}
