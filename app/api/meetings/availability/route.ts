import { NextResponse } from "next/server";
import {
  dateRange,
  getBusyIntervals,
  getTimezone,
  validMeetingStarts,
  overlaps,
  formatSlot,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function todayIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || todayIndia();
    const days = Math.min(Math.max(Number(searchParams.get("days") || "21"), 7), 31);
    const dates = dateRange(startDate, days);

    const rangeStart = `${dates[0]}T00:00:00+05:30`;
    const rangeEnd = `${dates[dates.length - 1]}T23:59:59+05:30`;
    const busy = await getBusyIntervals(rangeStart, rangeEnd);

    const availability = dates.map((date) => {
      const slots = validMeetingStarts(date)
        .filter((slot) => !overlaps(slot.start, slot.end, busy))
        .map(formatSlot);

      const weekday = new Intl.DateTimeFormat("en-IN", {
        timeZone: getTimezone(),
        weekday: "short",
      }).format(new Date(`${date}T12:00:00+05:30`));

      return { date, weekday, slots };
    });

    return NextResponse.json({
      timeZone: getTimezone(),
      durationMinutes: Number(process.env.EVC_MEETING_DURATION_MINUTES || "20"),
      availability,
    });
  } catch (error) {
    console.error("Meeting availability error", error);
    return NextResponse.json(
      { error: "Meeting availability is temporarily unavailable." },
      { status: 500 },
    );
  }
}
