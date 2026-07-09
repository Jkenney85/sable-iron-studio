import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

// GET /api/availability?artistId=&appointmentTypeId=&date=YYYY-MM-DD
// Returns the slot grid (available + unavailable) for the booking calendar.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artistId = searchParams.get("artistId");
  const appointmentTypeId = searchParams.get("appointmentTypeId");
  const date = searchParams.get("date");

  if (!artistId || !appointmentTypeId || !date) {
    return NextResponse.json(
      { error: "artistId, appointmentTypeId and date are required." },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  const type = await prisma.appointmentType.findUnique({
    where: { id: appointmentTypeId },
    select: { durationMinutes: true, active: true },
  });
  if (!type || !type.active) {
    return NextResponse.json({ error: "Unknown appointment type." }, { status: 404 });
  }

  const slots = await getAvailableSlots({
    artistId,
    dateStr: date,
    durationMinutes: type.durationMinutes,
  });

  return NextResponse.json({ date, slots });
}
