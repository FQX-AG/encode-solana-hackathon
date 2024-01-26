import { format as formatBase, formatInTimeZone } from "date-fns-tz";

export const DATE_FORMAT = "MMM dd, yyyy";
export const TIME_FORMAT = "HH:mm";
export const TZ_FORMAT = "zzz";
export const DATE_AND_TIME_FORMAT = `${DATE_FORMAT}, ${TIME_FORMAT}`;
export const DATE_WITH_TZ_FORMAT = `${DATE_FORMAT} ${TZ_FORMAT}`;
export const DATE_AND_TIME_WITH_TZ_FORMAT = `${DATE_FORMAT}, ${TIME_FORMAT} ${TZ_FORMAT}`;

export function formatDate(date: Date | string | undefined, withTime?: boolean) {
  if (!date) return "";
  try {
    return formatBase(new Date(date), withTime ? DATE_AND_TIME_FORMAT : DATE_FORMAT);
  } catch (err: unknown) {
    console.error({ err, arguments: Array.from(arguments) }, "Failed to format date.");

    return String(date);
  }
}

export function formatDateChunks(date: Date | string) {
  try {
    const d = new Date(date);

    return {
      date: formatBase(d, DATE_FORMAT),
      time: formatBase(d, TIME_FORMAT),
      tz: formatBase(d, TZ_FORMAT),
    };
  } catch (err: unknown) {
    console.error({ err, arguments: Array.from(arguments) }, "Failed to format date.");
  }
}

export function formatDateUTC(date: Date | string | undefined, withTz: boolean, withTime: boolean = true) {
  if (!date) return "";
  try {
    let format: string;
    if (withTime) {
      format = withTz ? DATE_AND_TIME_WITH_TZ_FORMAT : DATE_AND_TIME_FORMAT;
    } else {
      format = withTz ? DATE_WITH_TZ_FORMAT : DATE_FORMAT;
    }

    return formatInTimeZone(date, "UTC", format);
  } catch (err: unknown) {
    console.error({ err, arguments: Array.from(arguments) }, "Failed to format UTC date.");

    return String(date);
  }
}

export function formatDateUTCAlt(date: Date | string) {
  try {
    return formatInTimeZone(date, "UTC", `${TZ_FORMAT} ${DATE_FORMAT} ${TIME_FORMAT}`);
  } catch (err: unknown) {
    console.error({ err, arguments: Array.from(arguments) }, "Failed to format UTC date.");

    return String(date);
  }
}

export function formatDateChunksUTC(date: Date | string) {
  try {
    const d = new Date(date);

    return {
      date: formatInTimeZone(d, "UTC", DATE_FORMAT),
      time: formatInTimeZone(d, "UTC", TIME_FORMAT),
      tz: formatInTimeZone(d, "UTC", TZ_FORMAT),
    };
  } catch (err: unknown) {
    console.error({ err, arguments: Array.from(arguments) }, "Failed to format UTC date.");
  }
}

export const formatPercentage = (units: number, minimumFractionDigits: number = 2, maximumFractionDigits: number = 2) =>
  units.toLocaleString("en-US", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  });

export const formatDecimal = (units: number, minimumFractionDigits: number = 0, maximumFractionDigits: number = 0) => {
  return units.toLocaleString("en-US", {
    style: "decimal",
    minimumFractionDigits,
    maximumFractionDigits,
  });
};

export const formatPublicKey = (value: string, slice = 4) => {
  if (slice < 1) throw new Error('Invalid "slice" argument');

  if (!value || value.length <= slice * 2 + 1) return value;

  return `${value.slice(0, slice)}\u2026${value.slice(-slice)}`;
};

export const formatWalletName = (name: string) => {
  if (name.length > 13) {
    return `${name.slice(0, 12)}\u2026`;
  }

  return name;
};

type FormatIssuanceNameProps = {
  name?: string;
  secured: boolean;
  structured: boolean;
};

export const formatIssuanceName = ({ name, secured, structured }: FormatIssuanceNameProps) => {
  let bondName = "eNote issuance";
  if (structured) bondName = "Structured product Issuance";
  else if (secured) bondName = "Secured eNote issuance";

  return name ? `${name} – ${bondName}` : bondName;
};

export const formatUtcOffset = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  const utcOffset = -date.getTimezoneOffset() / 60;
  let shortName = "UTC";
  if (utcOffset < 0) {
    shortName += utcOffset;
  } else if (utcOffset > 0) {
    shortName += "+" + utcOffset;
  }

  return shortName;
};
