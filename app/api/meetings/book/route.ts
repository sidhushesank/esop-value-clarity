import { NextResponse } from "next/server";
import { createMeeting } from "@/lib/google-calendar";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const note = String(body?.note || "").trim();
    const startIso = String(body?.startIso || "").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!validEmail(email) || email.length > 200) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (note.length > 1500) {
      return NextResponse.json({ error: "Please keep the note under 1,500 characters." }, { status: 400 });
    }
    if (!startIso) {
      return NextResponse.json({ error: "Please choose a meeting time." }, { status: 400 });
    }

    const meeting = await createMeeting({ name, email, note, startIso });

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error) {
    const code = (error as Error & { code?: string }).code;
    if (code === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "That time was just taken. Please choose another available slot." },
        { status: 409 },
      );
    }

    console.error("Meeting booking error", error);
    return NextResponse.json(
      { error: "We could not complete the booking. Please try another slot." },
      { status: 500 },
    );
  }
}
