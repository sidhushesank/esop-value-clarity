import { google } from "googleapis";
import crypto from "node:crypto";

const TIME_ZONE = process.env.EVC_MEETING_TIME_ZONE || "Asia/Kolkata";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const DURATION_MINUTES = Number(process.env.EVC_MEETING_DURATION_MINUTES || "20");
const DAY_START_HOUR = Number(process.env.EVC_MEETING_START_HOUR || "10");
const DAY_END_HOUR = Number(process.env.EVC_MEETING_END_HOUR || "19");
const SLOT_MINUTES = Number(process.env.EVC_MEETING_SLOT_MINUTES || "30");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export type CalendarSlot = {
  start: string;
  end: string;
  label: string;
};

type BusyInterval = {
  start?: string | null;
  end?: string | null;
};

export function getOAuthClient() {
  const client = new google.auth.OAuth2(
    required("GOOGLE_CLIENT_ID"),
    required("GOOGLE_CLIENT_SECRET"),
    required("GOOGLE_REDIRECT_URI"),
  );

  client.setCredentials({
    refresh_token: required("GOOGLE_CALENDAR_REFRESH_TOKEN"),
  });

  return client;
}

export function calendarClient() {
  return google.calendar({ version: "v3", auth: getOAuthClient() });
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function dateOnlyInIndia(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekdayInIndia(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
}

function isoForIndia(dateString: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${dateString}T${hh}:${mm}:00+05:30`;
}

function addDaysIndia(dateString: string, days: number) {
  const base = new Date(`${dateString}T12:00:00+05:30`);
  base.setUTCDate(base.getUTCDate() + days);
  return dateOnlyInIndia(base);
}

/**
 * A slot is already in the past when its start time is at or before the
 * current instant. This uses the actual instant and therefore correctly
 * handles today's date while leaving future dates untouched.
 */
export function isSlotInPast(startIso: string, now = new Date()) {
  const start = new Date(startIso);
  return Number.isNaN(start.getTime()) || start.getTime() <= now.getTime();
}

export function validMeetingStarts(dateString: string): CalendarSlot[] {
  const noon = new Date(`${dateString}T12:00:00+05:30`);
  const weekday = weekdayInIndia(noon);

  if (weekday === "Sat" || weekday === "Sun") return [];

  const now = new Date();
  const isToday = dateString === dateOnlyInIndia(now);
  const slots: CalendarSlot[] = [];

  for (
    let minutes = DAY_START_HOUR * 60;
    minutes + DURATION_MINUTES <= DAY_END_HOUR * 60;
    minutes += SLOT_MINUTES
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const start = isoForIndia(dateString, hour, minute);
    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + DURATION_MINUTES);

    // For today, do not expose meeting starts that have already passed.
    // Future dates continue to expose their full working-day schedule.
    if (isToday && isSlotInPast(start, now)) {
      continue;
    }

    slots.push({
      start,
      end: endDate.toISOString(),
      label: formatTime(start),
    });
  }

  return slots;
}

export function dateRange(startDate: string, days: number) {
  return Array.from({ length: days }, (_, index) =>
    addDaysIndia(startDate, index),
  );
}

export async function getBusyIntervals(
  timeMin: string,
  timeMax: string,
): Promise<BusyInterval[]> {
  const calendar = calendarClient();

  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TIME_ZONE,
      items: [{ id: CALENDAR_ID }],
    },
  });

  return result.data.calendars?.[CALENDAR_ID]?.busy ?? [];
}

export function overlaps(
  startIso: string,
  endIso: string,
  busy: BusyInterval[],
) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return busy.some((interval) => {
    if (!interval.start || !interval.end) return false;

    const busyStart = new Date(interval.start).getTime();
    const busyEnd = new Date(interval.end).getTime();

    return start < busyEnd && end > busyStart;
  });
}

export function isValidMeetingStart(startIso: string) {
  const date = new Date(startIso);

  if (Number.isNaN(date.getTime())) return false;

  // Server-side protection: a past start time can never be booked,
  // even if somebody manually submits an old slot to the API.
  if (isSlotInPast(startIso)) return false;

  const dateString = dateOnlyInIndia(date);

  return validMeetingStarts(dateString).some(
    (slot) => new Date(slot.start).getTime() === date.getTime(),
  );
}

function deterministicEventId(startIso: string) {
  const digest = crypto
    .createHash("sha256")
    .update(startIso)
    .digest("hex")
    .slice(0, 40);

  return `evcslot${digest}`;
}

function isGoogleConflict(error: unknown) {
  const status = (error as { code?: number })?.code;
  const responseStatus = (
    error as { response?: { status?: number } }
  )?.response?.status;

  return status === 409 || responseStatus === 409;
}

export async function createMeeting(input: {
  name: string;
  email: string;
  note?: string;
  startIso: string;
}) {
  if (!isValidMeetingStart(input.startIso)) {
    throw new Error("That meeting time is no longer available or is not a valid EVC meeting slot.");
  }

  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + DURATION_MINUTES * 60_000);

  // First availability check happens immediately before booking.
  const busy = await getBusyIntervals(
    start.toISOString(),
    end.toISOString(),
  );

  if (overlaps(start.toISOString(), end.toISOString(), busy)) {
    const error = new Error(
      "That time was just taken. Please choose another available slot.",
    );

    (error as Error & { code?: string }).code = "SLOT_TAKEN";
    throw error;
  }

  const calendar = calendarClient();
  const eventId = deterministicEventId(input.startIso);

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      sendUpdates: "all",
      conferenceDataVersion: 1,
      requestBody: {
        id: eventId,
        summary: "EVC Product Conversation",
        description: [
          "ESOP Value Clarity product conversation.",
          `Visitor: ${input.name}`,
          `Email: ${input.email}`,
          input.note?.trim()
            ? `\nVisitor note:\n${input.note.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        start: {
          dateTime: start.toISOString(),
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: TIME_ZONE,
        },
        attendees: [{ email: input.email }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      meetLink:
        response.data.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === "video",
        )?.uri ?? null,
      start: input.startIso,
      end: end.toISOString(),
    };
  } catch (error) {
    // If another request created this exact event after our FreeBusy check,
    // Google can reject the insert with HTTP 409. Treat that as a booking
    // conflict rather than a generic server error.
    if (isGoogleConflict(error)) {
      const slotTaken = new Error(
        "That time was just taken. Please choose another available slot.",
      );

      (slotTaken as Error & { code?: string }).code = "SLOT_TAKEN";
      throw slotTaken;
    }

    throw error;
  }
}

export function formatSlot(slot: CalendarSlot) {
  return {
    ...slot,
    label: `${slot.label} IST`,
  };
}

export function getTimezone() {
  return TIME_ZONE;
}
