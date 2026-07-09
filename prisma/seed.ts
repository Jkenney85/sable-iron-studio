import {
  PrismaClient,
  PaymentPolicy,
  BookingStatus,
  PaymentStatus,
  PaymentChoice,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { makeReference } from "../src/lib/format";

const prisma = new PrismaClient();

// Unsplash source images used for demo portfolio/avatars only. Replace with your
// own storage/CDN in production (see TODO: production file storage).
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

async function main() {
  console.log("▸ Seeding Sable & Iron demo data…");

  // ── Studio settings ─────────────────────────────────────────────────────────
  await prisma.studioSetting.upsert({
    where: { id: "studio" },
    update: {},
    create: {
      id: "studio",
      name: "Sable & Iron",
      tagline: "Custom tattooing, built to last.",
      about:
        "Sable & Iron is a five-chair private studio in the Iron District. We specialize in custom work — blackwork, fine line, neo-traditional and illustrative color — made in collaboration with each client. No flash walls, no rushing. Every piece is drawn for the person wearing it.",
      email: "hello@sableiron.studio",
      phone: "(503) 555-0142",
      addressLine1: "118 Foundry Street",
      addressLine2: "Suite 3",
      city: "Portland",
      region: "OR",
      postalCode: "97209",
      country: "USA",
      instagram: "@sableiron",
      depositPolicy:
        "A deposit is required to hold every appointment. It comes off the final price of your tattoo and is non-refundable, but transfers once if you reschedule with 48 hours' notice.",
      cancellationPolicy:
        "Please give at least 48 hours' notice to reschedule. No-shows and same-day cancellations forfeit the deposit.",
      currency: "usd",
      timezone: "America/Los_Angeles",
      hoursJson: {
        Mon: "Closed",
        Tue: "12–8",
        Wed: "12–8",
        Thu: "12–8",
        Fri: "12–9",
        Sat: "11–9",
        Sun: "11–6",
      },
    },
  });

  // ── Admin ───────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "studio@sableiron.test";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme-admin-password";
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Studio Owner",
      role: "owner",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  console.log(`  · admin: ${adminEmail} / ${adminPassword}`);

  // ── Appointment types ───────────────────────────────────────────────────────
  const consult = await prisma.appointmentType.upsert({
    where: { slug: "consultation" },
    update: {},
    create: {
      slug: "consultation",
      name: "Consultation",
      description:
        "Sit down with your artist to talk through the idea, placement and plan. 30 minutes, applied toward your booking deposit.",
      durationMinutes: 30,
      priceCents: 3000,
      depositCents: 3000,
      paymentPolicy: PaymentPolicy.FULL_REQUIRED,
      requiresIntake: true,
      color: "#7c8b9a",
      sortOrder: 1,
    },
  });

  const smallTattoo = await prisma.appointmentType.upsert({
    where: { slug: "small-tattoo" },
    update: {},
    create: {
      slug: "small-tattoo",
      name: "Small Tattoo (up to 2 hrs)",
      description:
        "Fine line, lettering, small blackwork and single-session pieces. Deposit holds your chair; balance is due at the session.",
      durationMinutes: 120,
      priceCents: 28000,
      depositCents: 8000,
      paymentPolicy: PaymentPolicy.CUSTOMER_CHOICE,
      requiresIntake: true,
      color: "#e2472a",
      sortOrder: 2,
    },
  });

  const halfDay = await prisma.appointmentType.upsert({
    where: { slug: "half-day" },
    update: {},
    create: {
      slug: "half-day",
      name: "Half-Day Session (4 hrs)",
      description:
        "For larger custom work and multi-part pieces. Flat half-day rate with a deposit to reserve.",
      durationMinutes: 240,
      priceCents: 60000,
      depositCents: 15000,
      paymentPolicy: PaymentPolicy.DEPOSIT_REQUIRED,
      requiresIntake: true,
      color: "#c9962f",
      sortOrder: 3,
    },
  });

  const fullDay = await prisma.appointmentType.upsert({
    where: { slug: "full-day" },
    update: {},
    create: {
      slug: "full-day",
      name: "Full-Day Session (7 hrs)",
      description:
        "Sleeves, back pieces and big illustrative work. Full day, paid up front or by deposit.",
      durationMinutes: 420,
      priceCents: 110000,
      depositCents: 25000,
      paymentPolicy: PaymentPolicy.CUSTOMER_CHOICE,
      requiresIntake: true,
      color: "#5a8f6e",
      sortOrder: 4,
    },
  });

  const types = [consult, smallTattoo, halfDay, fullDay];

  // ── Artists ─────────────────────────────────────────────────────────────────
  const artistSeed = [
    {
      slug: "mara-okonkwo",
      name: "Mara Okonkwo",
      pronouns: "she/her",
      title: "Resident Artist · Co-founder",
      styles: ["Blackwork", "Ornamental", "Illustrative"],
      bio: "Mara builds bold, symmetry-driven blackwork and ornamental pieces. She draws from textile patterns, architecture and botanical illustration, and loves large-scale work that wraps the body.",
      avatar: img("photo-1544005313-94ddf0286df2", 500),
      hero: img("photo-1611501275019-9b5cda994e8d"),
      instagram: "@mara.inks",
      styleImgs: [
        "photo-1590246814883-57c511e76523",
        "photo-1565058379802-bbe93b2f703a",
        "photo-1612459284970-e8f027596582",
      ],
    },
    {
      slug: "diego-salas",
      name: "Diego Salas",
      pronouns: "he/him",
      title: "Resident Artist",
      styles: ["Fine line", "Micro-realism", "Lettering"],
      bio: "Diego specializes in delicate fine-line and single-needle work — script, small florals and hyper-detailed micro pieces. Precision is the whole point.",
      avatar: img("photo-1507003211169-0a1dd7228f2d", 500),
      hero: img("photo-1562962230-16e4623d36e6"),
      instagram: "@diego.fineline",
      styleImgs: [
        "photo-1611691543416-42b3a3f2c3a1",
        "photo-1543059080-f9b1272213d5",
        "photo-1568515387631-8b650bbcdb90",
      ],
    },
    {
      slug: "june-hollis",
      name: "June Hollis",
      pronouns: "they/them",
      title: "Resident Artist",
      styles: ["Neo-traditional", "Color", "Illustrative"],
      bio: "June makes saturated neo-traditional color work — animals, folklore and bold botanicals with heavy line weight and a painterly palette.",
      avatar: img("photo-1531123897727-8f129e1688ce", 500),
      hero: img("photo-1598371839696-5c5bb00bdc28"),
      instagram: "@junehollis.art",
      styleImgs: [
        "photo-1580281658626-ee379f3cce93",
        "photo-1611501275019-9b5cda994e8d",
        "photo-1550537687-c91072c4792d",
      ],
    },
    {
      slug: "priya-anand",
      name: "Priya Anand",
      pronouns: "she/her",
      title: "Guest Artist",
      styles: ["Dotwork", "Geometric", "Blackwork"],
      bio: "Priya's dotwork and sacred-geometry pieces are built dot by dot. Meditative, mathematical, and made to sit cleanly on the body's lines.",
      avatar: img("photo-1592621385612-4d7129426394", 500),
      hero: img("photo-1600180758890-6b94519a8ba6"),
      instagram: "@priya.dots",
      styleImgs: [
        "photo-1614521825926-df6afcd7f4f4",
        "photo-1517263904808-5dc91e3e7044",
        "photo-1571501679680-de32f1e7aad4",
      ],
    },
  ];

  const artists = [];
  for (let i = 0; i < artistSeed.length; i++) {
    const a = artistSeed[i];
    const artist = await prisma.artist.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        name: a.name,
        pronouns: a.pronouns,
        title: a.title,
        styles: a.styles,
        bio: a.bio,
        avatarUrl: a.avatar,
        heroUrl: a.hero,
        instagram: a.instagram,
        active: true,
        bookingOpen: a.slug !== "priya-anand" ? true : true,
        sortOrder: i,
      },
    });
    artists.push(artist);

    // Weekly availability (Tue–Sat, varied hours). dayOfWeek: 0=Sun … 6=Sat.
    const windows =
      i % 2 === 0
        ? [
            { day: 2, s: 12 * 60, e: 20 * 60 },
            { day: 3, s: 12 * 60, e: 20 * 60 },
            { day: 4, s: 12 * 60, e: 20 * 60 },
            { day: 5, s: 12 * 60, e: 21 * 60 },
            { day: 6, s: 11 * 60, e: 19 * 60 },
          ]
        : [
            { day: 3, s: 13 * 60, e: 21 * 60 },
            { day: 4, s: 13 * 60, e: 21 * 60 },
            { day: 5, s: 12 * 60, e: 21 * 60 },
            { day: 6, s: 11 * 60, e: 19 * 60 },
            { day: 0, s: 11 * 60, e: 18 * 60 },
          ];
    await prisma.availabilityWindow.deleteMany({ where: { artistId: artist.id } });
    for (const w of windows) {
      await prisma.availabilityWindow.create({
        data: {
          artistId: artist.id,
          dayOfWeek: w.day,
          startMinutes: w.s,
          endMinutes: w.e,
        },
      });
    }

    // Portfolio items.
    for (let j = 0; j < a.styleImgs.length; j++) {
      await prisma.portfolioItem.create({
        data: {
          artistId: artist.id,
          title: `${a.styles[j % a.styles.length]} piece`,
          imageUrl: img(a.styleImgs[j]),
          style: a.styles[j % a.styles.length],
          featured: j === 0,
          sortOrder: j,
        },
      });
    }

    // Which appointment types this artist offers (everyone does small/consult;
    // residents also do half/full day).
    const offered = a.title.includes("Guest")
      ? [consult.id, smallTattoo.id]
      : types.map((t) => t.id);
    for (const appointmentTypeId of offered) {
      await prisma.appointmentTypeArtist.upsert({
        where: {
          appointmentTypeId_artistId: { appointmentTypeId, artistId: artist.id },
        },
        update: {},
        create: { appointmentTypeId, artistId: artist.id },
      });
    }
  }

  // ── Sample bookings with a spread of statuses ──────────────────────────────
  // Only create these once (skip if bookings already exist).
  const existing = await prisma.booking.count();
  if (existing === 0) {
    const day = (offset: number, hour: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const samples = [
      {
        customer: { name: "Alex Rivera", email: "alex.rivera@example.com", phone: "(503) 555-0110" },
        artist: artists[0],
        type: halfDay,
        start: day(3, 13),
        status: BookingStatus.CONFIRMED,
        choice: PaymentChoice.DEPOSIT,
        pay: PaymentStatus.PAID,
        intake: { placement: "Left forearm", approxSize: "Half sleeve", style: "Ornamental blackwork", budget: "$600–900", notes: "Botanical + geometric mix, mostly black with fine shading." },
      },
      {
        customer: { name: "Sam Chen", email: "sam.chen@example.com", phone: "(971) 555-0133" },
        artist: artists[1],
        type: smallTattoo,
        start: day(5, 15),
        status: BookingStatus.CONFIRMED,
        choice: PaymentChoice.FULL,
        pay: PaymentStatus.PAID,
        intake: { placement: "Inner wrist", approxSize: "2 inches", style: "Fine line script", budget: "$250", notes: "Single line quote in my grandmother's handwriting (photo attached at consult)." },
      },
      {
        customer: { name: "Nadia Brooks", email: "nadia.brooks@example.com" },
        artist: artists[2],
        type: fullDay,
        start: day(9, 12),
        status: BookingStatus.AWAITING_PAYMENT,
        choice: PaymentChoice.DEPOSIT,
        pay: PaymentStatus.PENDING,
        intake: { placement: "Thigh", approxSize: "Large", style: "Neo-traditional color", budget: "$1000+", notes: "Fox surrounded by peonies, warm palette." },
      },
      {
        customer: { name: "Theo Marsh", email: "theo.marsh@example.com", phone: "(503) 555-0177" },
        artist: artists[0],
        type: consult,
        start: day(1, 17),
        status: BookingStatus.CONFIRMED,
        choice: PaymentChoice.FULL,
        pay: PaymentStatus.PAID,
        intake: { placement: "Back", approxSize: "TBD", style: "Blackwork", notes: "Want to talk through a large back piece over a few sessions." },
      },
      {
        customer: { name: "Robin Alvarez", email: "robin.alvarez@example.com" },
        artist: artists[1],
        type: smallTattoo,
        start: day(-4, 16),
        status: BookingStatus.COMPLETED,
        choice: PaymentChoice.FULL,
        pay: PaymentStatus.PAID,
        intake: { placement: "Ankle", approxSize: "3 inches", style: "Micro floral" },
      },
      {
        customer: { name: "Jordan Lee", email: "jordan.lee@example.com" },
        artist: artists[2],
        type: halfDay,
        start: day(7, 14),
        status: BookingStatus.CANCELLED,
        choice: PaymentChoice.DEPOSIT,
        pay: PaymentStatus.REFUNDED,
        intake: { placement: "Calf", approxSize: "Medium", style: "Illustrative" },
      },
    ];

    for (const s of samples) {
      const customer = await prisma.customer.create({ data: s.customer });
      const amount =
        s.choice === PaymentChoice.DEPOSIT ? s.type.depositCents : s.type.priceCents;
      const booking = await prisma.booking.create({
        data: {
          reference: makeReference(),
          artistId: s.artist.id,
          appointmentTypeId: s.type.id,
          customerId: customer.id,
          startTime: s.start,
          endTime: new Date(s.start.getTime() + s.type.durationMinutes * 60000),
          status: s.status,
          paymentChoice: s.choice,
          amountDueCents: amount,
          currency: "usd",
          gcalSyncStatus: "disabled",
          intake: {
            create: {
              placement: s.intake.placement,
              approxSize: s.intake.approxSize,
              style: s.intake.style,
              budget: s.intake.budget,
              notes: s.intake.notes,
            },
          },
          payments: {
            create: {
              kind: s.choice,
              status: s.pay,
              amountCents: amount,
              currency: "usd",
              stripePaymentIntentId:
                s.pay === PaymentStatus.PENDING ? null : `pi_demo_${Math.random().toString(36).slice(2, 12)}`,
            },
          },
        },
      });
      console.log(`  · booking ${booking.reference} (${s.status})`);
    }
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
