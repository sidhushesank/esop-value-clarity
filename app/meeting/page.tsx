"use client";







import { useEffect, useMemo, useState } from "react";



import {



  CalendarDays,



  CheckCircle2,



  ChevronLeft,



  ChevronRight,



  Clock3,



  Loader2,



  Mail,



  UserRound,



  Video,



} from "lucide-react";







type Slot = { start: string; end: string; label: string };



type Day = { date: string; weekday: string; slots: Slot[] };



type AvailabilityResponse = {



  timeZone: string;



  durationMinutes: number;



  availability: Day[];



};







type BookingResult = {



  start: string;



  end?: string;



  meetLink: string | null;



};







type SlotGroup = {
  label: string;
  slots: DisplaySlot[];
};

type DisplaySlot = Slot & {
  isPast: boolean;
  syntheticPast?: boolean;
};







const TZ = "Asia/Kolkata";







function parseDateInIndia(date: string) {



  // Availability day keys are YYYY-MM-DD, while successful bookings
  // return full ISO timestamps. Support both safely.
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T12:00:00+05:30`);
  }



  return new Date(date);



}







function formatDate(date: string) {



  return new Intl.DateTimeFormat("en-IN", {



    timeZone: TZ,



    weekday: "short",



    day: "numeric",



    month: "short",



  }).format(parseDateInIndia(date));



}







function formatLongDate(date: string) {



  return new Intl.DateTimeFormat("en-IN", {



    timeZone: TZ,



    weekday: "long",



    day: "numeric",



    month: "long",



    year: "numeric",



  }).format(parseDateInIndia(date));



}







function dayRelativeLabel(date: string) {



  const selected = parseDateInIndia(date);



  const todayString = new Intl.DateTimeFormat("en-CA", {



    timeZone: TZ,



    year: "numeric",



    month: "2-digit",



    day: "2-digit",



  }).format(new Date());



  const today = parseDateInIndia(todayString);



  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);







  const selectedKey = new Intl.DateTimeFormat("en-CA", {



    timeZone: TZ,



    year: "numeric",



    month: "2-digit",



    day: "2-digit",



  }).format(selected);



  const tomorrowKey = new Intl.DateTimeFormat("en-CA", {



    timeZone: TZ,



    year: "numeric",



    month: "2-digit",



    day: "2-digit",



  }).format(tomorrow);







  if (selectedKey === todayString) return "Today";



  if (selectedKey === tomorrowKey) return "Tomorrow";



  return new Intl.DateTimeFormat("en-IN", {



    timeZone: TZ,



    weekday: "short",



  }).format(selected);



}







function slotHour(slot: Slot) {



  return new Date(slot.start).getHours();



}







function groupSlots(slots: DisplaySlot[]): SlotGroup[] {



  const groups: SlotGroup[] = [



    { label: "Morning", slots: [] },



    { label: "Afternoon", slots: [] },



    { label: "Evening", slots: [] },



  ];







  for (const slot of slots) {



    const hour = slotHour(slot);



    if (hour < 12) groups[0].slots.push(slot);



    else if (hour < 17) groups[1].slots.push(slot);



    else groups[2].slots.push(slot);



  }







  return groups.filter((group) => group.slots.length > 0);



}







function currentIndiaDateKey() {

  return new Intl.DateTimeFormat("en-CA", {

    timeZone: TZ,

    year: "numeric",

    month: "2-digit",

    day: "2-digit",

  }).format(new Date());

}



const DISPLAY_START_HOUR = 10;
const DISPLAY_END_HOUR = 19;
const DISPLAY_SLOT_MINUTES = 30;

function isoForIndia(dateString: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${dateString}T${hh}:${mm}:00+05:30`;
}

function isSlotPast(startIso: string) {
  return new Date(startIso).getTime() <= Date.now();
}

function buildDisplaySlots(day: Day | null, durationMinutes: number): DisplaySlot[] {
  if (!day) return [];

  const slotMap = new Map<string, Slot>();
  for (const slot of day.slots) slotMap.set(slot.start, slot);

  // The availability API can omit already-passed slots for today.
  // Recreate ONLY those past schedule entries for visual context.
  // Future slots always come from the real API, so busy future times are never invented.
  if (day.date === currentIndiaDateKey()) {
    const now = Date.now();

    for (
      let minutes = DISPLAY_START_HOUR * 60;
      minutes + durationMinutes <= DISPLAY_END_HOUR * 60;
      minutes += DISPLAY_SLOT_MINUTES
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const start = isoForIndia(day.date, hour, minute);

      if (new Date(start).getTime() > now || slotMap.has(start)) continue;

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMinutes);

      slotMap.set(start, {
        start,
        end: end.toISOString(),
        label: formatSelectedTime(start),
      });
    }
  }

  return Array.from(slotMap.values())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map((slot) => ({
      ...slot,
      isPast: isSlotPast(slot.start),
      syntheticPast:
        day.date === currentIndiaDateKey() &&
        !day.slots.some((item) => item.start === slot.start),
    }));
}

function monthKeyFromDate(date: string) {

  return date.slice(0, 7);

}



function monthStartDate(monthKey: string) {

  return `${monthKey}-01`;

}



function daysInMonth(monthKey: string) {

  const [year, month] = monthKey.split("-").map(Number);

  return new Date(Date.UTC(year, month, 0)).getUTCDate();

}



function shiftMonth(monthKey: string, delta: number) {

  const [year, month] = monthKey.split("-").map(Number);

  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));

  const nextYear = shifted.getUTCFullYear();

  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;

}



function formatMonthTitle(monthKey: string) {

  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {

    month: "long",

    year: "numeric",

    timeZone: "UTC",

  }).format(new Date(Date.UTC(year, month - 1, 1)));

}



function calendarDates(monthKey: string): Array<string | null> {

  const [year, month] = monthKey.split("-").map(Number);

  const first = new Date(Date.UTC(year, month - 1, 1));

  const offset = first.getUTCDay();

  const days = daysInMonth(monthKey);

  return Array.from({ length: offset + days }, (_, index) => {

    if (index < offset) return null;

    const day = index - offset + 1;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  });

}



function formatSelectedTime(start: string) {



  return new Intl.DateTimeFormat("en-IN", {



    timeZone: TZ,



    hour: "numeric",



    minute: "2-digit",



    hour12: true,



  }).format(new Date(start));



}







export default function MeetingPage() {



  const [data, setData] = useState<AvailabilityResponse | null>(null);



  const [selectedDay, setSelectedDay] = useState("");



  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);



  const [name, setName] = useState("");



  const [email, setEmail] = useState("");



  const [note, setNote] = useState("");



  const [loading, setLoading] = useState(true);



  const [booking, setBooking] = useState(false);



  const [error, setError] = useState("");



  const [success, setSuccess] = useState<BookingResult | null>(null);



  const [calendarOpen, setCalendarOpen] = useState(false);



  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyFromDate(currentIndiaDateKey()));

  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);

  const [calendarLoading, setCalendarLoading] = useState(false);

  const [calendarError, setCalendarError] = useState("");







  async function fetchAvailability(startDate: string, days: number) {

    const response = await fetch(

      `/api/meetings/availability?startDate=${encodeURIComponent(startDate)}&days=${Math.min(Math.max(days, 7), 31)}`,

      { cache: "no-store" },

    );



    const json = await response.json();



    if (!response.ok) {

      throw new Error(json?.error || "Could not load availability.");

    }



    return json as AvailabilityResponse;

  }



  function mergeAvailability(nextData: AvailabilityResponse) {

    setData((current) => {

      const map = new Map<string, Day>();



      for (const day of current?.availability ?? []) {

        map.set(day.date, day);

      }



      for (const day of nextData.availability) {

        map.set(day.date, day);

      }



      return {

        timeZone: nextData.timeZone,

        durationMinutes: nextData.durationMinutes,

        availability: Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)),

      };

    });

  }



  async function loadAvailability(preferredDay?: string) {

    setLoading(true);

    setError("");



    try {

      const startDate = currentIndiaDateKey();

      const nextData = await fetchAvailability(startDate, 31);

      mergeAvailability(nextData);



      const availableDays = nextData.availability.filter((day) => day.slots.length > 0);

      const nextDay =

        availableDays.find((day) => day.date === preferredDay) ?? availableDays[0] ?? null;



      if (nextDay) {

        setSelectedDay(nextDay.date);

        setCalendarMonth(monthKeyFromDate(nextDay.date));

      } else {

        setSelectedDay("");

      }



      setSelectedSlot(null);

      setLoadedMonths((current) => Array.from(new Set([...current, monthKeyFromDate(startDate)])));

    } catch (err) {

      setError(err instanceof Error ? err.message : "Could not load availability.");

    } finally {

      setLoading(false);

    }

  }



  async function loadCalendarMonth(monthKey: string) {

    if (loadedMonths.includes(monthKey)) return;



    setCalendarLoading(true);

    setCalendarError("");



    try {

      const currentMonth = monthKeyFromDate(currentIndiaDateKey());

      const startDate = monthKey === currentMonth ? currentIndiaDateKey() : monthStartDate(monthKey);

      const days = monthKey === currentMonth ? 31 : daysInMonth(monthKey);

      const nextData = await fetchAvailability(startDate, days);



      mergeAvailability(nextData);

      setLoadedMonths((current) => Array.from(new Set([...current, monthKey])));

    } catch (err) {

      setCalendarError(

        err instanceof Error ? err.message : "Could not load that month's availability.",

      );

    } finally {

      setCalendarLoading(false);

    }

  }







  useEffect(() => {



    void loadAvailability();



  }, []);







  const activeDay = useMemo(



    () => data?.availability.find((day) => day.date === selectedDay) ?? null,



    [data, selectedDay],



  );







  const availableDays = useMemo(

    () => data?.availability.filter((day) => day.slots.length > 0).slice(0, 7) ?? [],

    [data],

  );



  const availableDayMap = useMemo(() => {

    const map = new Map<string, Day>();

    for (const day of data?.availability ?? []) {

      if (day.slots.length > 0) map.set(day.date, day);

    }

    return map;

  }, [data]);



  const calendarCells = useMemo(() => calendarDates(calendarMonth), [calendarMonth]);



  const minCalendarMonth = monthKeyFromDate(currentIndiaDateKey());

  const maxCalendarMonth = shiftMonth(minCalendarMonth, 5);



  const canGoPreviousMonth = calendarMonth > minCalendarMonth;

  const canGoNextMonth = calendarMonth < maxCalendarMonth;

  const monthLoaded = loadedMonths.includes(calendarMonth);



  const displaySlots = useMemo(
    () => buildDisplaySlots(activeDay, data?.durationMinutes ?? 20),
    [activeDay, data?.durationMinutes],
  );

  const slotGroups = useMemo(
    () => groupSlots(displaySlots),
    [displaySlots],
  );







  const canBook = Boolean(



    selectedSlot && name.trim().length >= 2 && email.trim() && !booking,



  );







  const buttonLabel = booking



    ? "Booking your meeting..."



    : !selectedSlot



      ? "Choose a time to continue"



      : !name.trim() || !email.trim()



        ? "Complete your details to book"



        : "Book this time";







  function moveCalendarMonth(delta: number) {

    const nextMonth = shiftMonth(calendarMonth, delta);



    if (delta < 0 && !canGoPreviousMonth) return;

    if (delta > 0 && !canGoNextMonth) return;



    setCalendarMonth(nextMonth);

    setCalendarOpen(true);

    void loadCalendarMonth(nextMonth);

  }



  function chooseDay(date: string) {

    const day = availableDayMap.get(date);



    setError("");

    setSelectedSlot(null);



    if (!day) {

      setSelectedDay("");

      setCalendarOpen(false);

      setError("There are no available times on that date. Choose another date.");

      return;

    }



    setSelectedDay(day.date);

    setCalendarMonth(monthKeyFromDate(day.date));

    setCalendarOpen(false);

  }



  async function book() {



    if (!selectedSlot) return;







    setBooking(true);



    setError("");







    try {



      const response = await fetch("/api/meetings/book", {



        method: "POST",



        headers: { "Content-Type": "application/json" },



        body: JSON.stringify({



          name,



          email,



          note,



          startIso: selectedSlot.start,



        }),



      });







      const json = await response.json();







      if (!response.ok) {



        if (response.status === 409) {



          await loadAvailability(selectedDay);



        }



        throw new Error(json?.error || "Booking failed.");



      }







      setSuccess({



        start: json.meeting.start,



        end: json.meeting.end,



        meetLink: json.meeting.meetLink,



      });



    } catch (err) {



      setError(err instanceof Error ? err.message : "Booking failed.");



    } finally {



      setBooking(false);



    }



  }







  if (success) {



    return (



      <main className="min-h-screen bg-[#f4f8ff] px-6 py-16 text-slate-950">



        <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.10)] md:p-12">



          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">



            <CheckCircle2 className="h-8 w-8" />



          </div>







          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">



            EVC product conversation



          </p>







          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">



            You&apos;re booked.



          </h1>







          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-600">



            Your meeting has been added to the EVC calendar and a calendar



            invitation has been sent to your email.



          </p>







          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">



            <p className="text-sm font-black text-slate-950">



              {formatLongDate(success.start)}



            </p>



            <p className="mt-1 text-sm text-slate-600">



              {formatSelectedTime(success.start)} IST · 20 minutes



            </p>



          </div>







          {success.meetLink && (



            <a



              href={success.meetLink}



              target="_blank"



              rel="noreferrer"



              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#07111f] px-6 text-sm font-black text-white transition hover:-translate-y-0.5"



            >



              <Video className="h-4 w-4" />



              Join Google Meet



            </a>



          )}



        </div>



      </main>



    );



  }







  return (



    <main className="min-h-screen bg-[#f4f8ff] px-4 py-10 text-slate-950 md:px-6 md:py-16">



      <section className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)]">



        <div className="grid lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">



          <div className="relative flex h-full min-h-[760px] flex-col overflow-hidden bg-[#07111f] p-7 text-white md:p-10">



            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] [background-size:32px_32px]" />



            <div className="relative">



              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">



                <CalendarDays className="h-3.5 w-3.5" />



                Book a product conversation



              </div>







              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] md:text-5xl">



                See EVC before you buy.



              </h1>







              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">



                Choose a time that works for you, tell us what you want to



                discuss, and have the product conversation directly from the



                site.



              </p>







              <div className="mt-9 space-y-3">



                {[



                  "See the actual workflow",



                  "Talk through your real use case",



                  "Decide whether PRO is worth it",



                ].map((item, index) => (



                  <div



                    key={item}



                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"



                  >



                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500 text-xs font-black text-white">



                      {String(index + 1).padStart(2, "0")}



                    </span>



                    <span className="text-sm font-black text-white">



                      {item}



                    </span>



                  </div>



                ))}



              </div>



              <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-200">

                  20-minute conversation

                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">

                  No pressure. Use the time to see the real product, talk through your situation, and decide what makes sense.

                </p>

              </div>



              <div className="mt-auto pt-8">

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">

                        Your conversation

                      </p>

                      <p className="mt-2 text-sm font-black text-white">

                        {selectedSlot

                          ? `${formatLongDate(selectedDay)} · ${formatSelectedTime(selectedSlot.start)} IST`

                          : "Choose a time when you're ready"}

                      </p>

                    </div>

                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300">

                      <CalendarDays className="h-4 w-4" />

                    </div>

                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">

                    Your selected time is checked against the live EVC calendar again when you book.

                  </p>

                </div>



                <div className="mt-4 grid grid-cols-3 gap-2">

                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">

                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Length</p>

                    <p className="mt-1 text-sm font-black text-white">20 min</p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">

                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Availability</p>

                    <p className="mt-1 text-sm font-black text-white">Live</p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">

                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Invite</p>

                    <p className="mt-1 text-sm font-black text-white">Calendar</p>

                  </div>

                </div>

              </div>

            </div>

          </div>



          <div className="min-w-0 p-6 md:p-10">



            <div className="flex items-center gap-2 text-blue-600">



              <Clock3 className="h-4 w-4" />



              <p className="text-[10px] font-black uppercase tracking-[0.16em]">



                Live availability · IST



              </p>



            </div>







            {loading ? (



              <div className="mt-10 flex items-center justify-center py-20 text-slate-500">



                <Loader2 className="mr-2 h-5 w-5 animate-spin" />



                Loading your available times...



              </div>



            ) : error && !data ? (



              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">



                {error}



              </div>



            ) : (



              <>



                <div className="mt-7 flex items-end justify-between gap-4">



                  <div>



                    <p className="text-xs font-black text-slate-950">



                      Choose a day



                    </p>



                    <p className="mt-1 text-sm text-slate-500">



                      Only days with available times are shown.



                    </p>



                  </div>



                  {data?.durationMinutes && (



                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">



                      {data.durationMinutes} min



                    </span>



                  )}



                </div>







                <div className="mt-4 grid gap-2 sm:grid-cols-3">



                  {availableDays.map((day) => {



                    const isSelected = selectedDay === day.date;



                    const relative = dayRelativeLabel(day.date);







                    return (



                      <button



                        key={day.date}



                        type="button"



                        onClick={() => chooseDay(day.date)}



                        className={`rounded-2xl border px-4 py-4 text-left transition ${



                          isSelected



                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"



                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white"



                        }`}



                      >



                        <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">



                          {relative}



                        </p>



                        <p className="mt-1 text-sm font-black">



                          {formatDate(day.date)}



                        </p>



                      </button>



                    );



                  })}



                </div>







                <div className="mt-4">

                  <button

                    type="button"

                    onClick={() => {

                      const nextOpen = !calendarOpen;

                      setCalendarOpen(nextOpen);

                      if (nextOpen) void loadCalendarMonth(calendarMonth);

                    }}

                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${

                      calendarOpen

                        ? "border-blue-600 bg-blue-50 text-blue-700"

                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"

                    }`}

                  >

                    <CalendarDays className="h-4 w-4" />

                    Pick another date

                  </button>

                </div>



                {calendarOpen && (

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="text-xs font-black text-slate-950">Choose from the calendar</p>

                        <p className="mt-1 text-sm text-slate-500">Choose any future date in the booking window. EVC checks live availability for that month.</p>

                      </div>

                      <div className="flex items-center gap-2">

                        <button type="button" aria-label="Previous month" disabled={!canGoPreviousMonth || calendarLoading} onClick={() => moveCalendarMonth(-1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30">

                          <ChevronLeft className="h-4 w-4" />

                        </button>

                        <button type="button" aria-label="Next month" disabled={!canGoNextMonth || calendarLoading} onClick={() => moveCalendarMonth(1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30">

                          <ChevronRight className="h-4 w-4" />

                        </button>

                      </div>

                    </div>



                    <div className="mt-4 flex items-center justify-center">

                      <p className="text-sm font-black text-slate-950">{formatMonthTitle(calendarMonth)}</p>

                    </div>



                    {calendarLoading && (

                      <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700">

                        <Loader2 className="h-4 w-4 animate-spin" />

                        Checking live availability...

                      </div>

                    )}



                    {calendarError && (

                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">

                        {calendarError}

                      </div>

                    )}



                    <div className="mt-5 grid grid-cols-7 gap-2 text-center">

                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (

                        <div key={dayName} className="py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">

                          {dayName.slice(0, 1)}

                        </div>

                      ))}



                      {calendarCells.map((date, index) => {

                        if (!date) return <div key={`empty-${index}`} className="h-11" />;

                        const day = availableDayMap.get(date);

                        const isAvailable = monthLoaded && Boolean(day);

                        const isSelected = selectedDay === date;

                        const today = currentIndiaDateKey() === date;

                        return (

                          <button key={date} type="button" disabled={!isAvailable || calendarLoading} onClick={() => chooseDay(date)} className={`relative h-11 rounded-xl border text-sm font-black transition ${isSelected ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100" : isAvailable ? "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50" : "cursor-not-allowed border-transparent bg-slate-50/60 text-slate-300"}`}>

                            {new Date(`${date}T12:00:00+05:30`).getDate()}

                            {today && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? "bg-white" : "bg-blue-600"}`} />}

                          </button>

                        );

                      })}

                    </div>

                  </div>

                )}



                {activeDay ? (



                  <div className="mt-8">



                    <div className="flex items-end justify-between gap-4">



                      <div>



                        <p className="text-xs font-black text-slate-950">



                          Choose a time



                        </p>



                        <p className="mt-1 text-sm text-slate-500">



                          {formatLongDate(activeDay.date)}



                        </p>
                        {activeDay.date === currentIndiaDateKey() && (
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            Earlier times are shown as passed. Only future times can be booked.
                          </p>
                        )}



                      </div>



                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">



                        Your local time · IST



                      </span>



                    </div>







                    <div className="mt-5">
                      {activeDay.date === currentIndiaDateKey() && (
                        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                            Already passed
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                            Future / bookable
                          </span>
                        </div>
                      )}

                      <div className="space-y-6">
                        {slotGroups.map((group) => (
                          <div key={group.label}>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              {group.label}
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {group.slots.map((slot) => {
                                const isSelected = selectedSlot?.start === slot.start;
                                const isPast = slot.isPast;

                                return (
                                  <button
                                    key={slot.start}
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => {
                                      if (isPast) return;
                                      setSelectedSlot(slot);
                                      setError("");
                                    }}
                                    title={isPast ? "This time has already passed." : "Select this meeting time"}
                                    aria-label={isPast ? `${slot.label} - time has passed` : `Select ${slot.label}`}
                                    className={`relative rounded-2xl border px-4 py-4 text-left text-sm font-black transition ${
                                      isPast
                                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 opacity-70"
                                        : isSelected
                                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_32px_rgba(7,17,31,0.14)]"
                                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"
                                    }`}
                                  >
                                    <span className={isPast ? "line-through decoration-slate-300" : ""}>
                                      {slot.label}
                                    </span>
                                    {isPast && (
                                      <span className="ml-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">
                                        Passed
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (



                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">



                    Choose a day to see its available times.



                  </div>



                )}







                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 md:p-6">



                  <div className="flex flex-wrap items-center justify-between gap-3">



                    <div>



                      <p className="text-xs font-black text-slate-950">



                        Your details



                      </p>



                      <p className="mt-1 text-sm text-slate-500">



                        We&apos;ll use these details for the calendar invite.



                      </p>



                    </div>



                    {selectedSlot && (



                      <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-600 shadow-sm ring-1 ring-slate-200">



                        {formatSelectedTime(selectedSlot.start)} IST



                      </span>



                    )}



                  </div>







                  <div className="mt-5 grid gap-4 sm:grid-cols-2">



                    <label className="block">



                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">



                        Name



                      </span>



                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">



                        <UserRound className="h-4 w-4 text-slate-400" />



                        <input



                          value={name}



                          onChange={(event) => setName(event.target.value)}



                          className="h-12 w-full bg-transparent text-sm outline-none"



                          placeholder="Your name"



                          autoComplete="name"



                        />



                      </div>



                    </label>







                    <label className="block">



                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">



                        Email



                      </span>



                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">



                        <Mail className="h-4 w-4 text-slate-400" />



                        <input



                          value={email}



                          onChange={(event) => setEmail(event.target.value)}



                          type="email"



                          className="h-12 w-full bg-transparent text-sm outline-none"



                          placeholder="you@example.com"



                          autoComplete="email"



                        />



                      </div>



                    </label>



                  </div>







                  <label className="mt-4 block">



                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">



                      What would you like to discuss?{" "}



                      <span className="font-normal normal-case tracking-normal">



                        (optional)



                      </span>



                    </span>



                    <textarea



                      value={note}



                      onChange={(event) => setNote(event.target.value)}



                      rows={3}



                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"



                      placeholder="Tell us what you'd like to discuss. For example: understanding your ESOP grant, comparing two offers, or seeing whether EVC fits your workflow."



                    />



                  </label>







                  {error && (



                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">



                      {error}



                    </div>



                  )}







                  <button



                    type="button"



                    disabled={!canBook}



                    onClick={() => void book()}



                    className={`mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black transition ${



                      canBook



                        ? "bg-[#07111f] text-white shadow-[0_18px_40px_rgba(7,17,31,0.16)] hover:-translate-y-0.5 hover:bg-[#0b1728]"



                        : "cursor-not-allowed bg-slate-200 text-slate-500"



                    }`}



                  >



                    {booking ? (



                      <Loader2 className="h-4 w-4 animate-spin" />



                    ) : (



                      <CalendarDays className="h-4 w-4" />



                    )}



                    {buttonLabel}



                  </button>







                  {!selectedSlot && (



                    <p className="mt-3 text-center text-xs text-slate-400">



                      Select a time above to continue.



                    </p>



                  )}



                </div>



              </>



            )}



          </div>



        </div>



      </section>



    </main>



  );



}
