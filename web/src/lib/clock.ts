/** Operational time zone for Glendale FD. */
export const OPS_TIME_ZONE = "America/Los_Angeles";

export interface ClockParts {
  /** 24-hour HH:MM:SS, the fire-service convention. */
  time: string;
  /** Zone abbreviation, e.g. "PDT" or "PST". */
  zone: string;
  /** Short date, e.g. "Thu, Sep 25". */
  date: string;
}

const formatters = new Map<string, { time: Intl.DateTimeFormat; date: Intl.DateTimeFormat }>();

function formattersFor(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = {
      time: new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short",
      }),
      date: new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    };
    formatters.set(timeZone, f);
  }
  return f;
}

export function formatClock(epochMs: number, timeZone: string = OPS_TIME_ZONE): ClockParts {
  const { time, date } = formattersFor(timeZone);
  const parts = time.formatToParts(epochMs);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
    zone: get("timeZoneName"),
    date: date.format(epochMs),
  };
}
