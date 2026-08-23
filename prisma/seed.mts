/**
 * Seeds a demo society: one admin, four residents, a spread of complaints
 * across every status and several categories, and a notice board.
 *
 * Complaints are backdated so that some of them are genuinely past the default
 * 3-day overdue threshold, which makes overdue detection visible immediately.
 *
 * Run with: npm run db:seed
 */
import { Category, ComplaintStatus, PrismaClient, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (days: number, hour = 10): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

type Step = { to: ComplaintStatus; note: string; afterDays: number };

type Spec = {
  category: Category;
  title: string;
  description: string;
  priority: Priority;
  residentIndex: number;
  createdDaysAgo: number;
  steps: Step[];
  flagged?: boolean;
};

const SPECS: Spec[] = [
  {
    category: Category.PLUMBING,
    title: "Continuous water leakage from bathroom ceiling",
    description:
      "Water has been dripping from the bathroom ceiling since Monday. The patch is spreading and the paint has started peeling. Suspect a leak from the flat above.",
    priority: Priority.HIGH,
    residentIndex: 0,
    createdDaysAgo: 9,
    steps: [],
  },
  {
    category: Category.LIFT,
    title: "Lift B stops between floors 4 and 5",
    description:
      "Lift B halts between the 4th and 5th floor and the doors take almost a minute to open. Two residents were stuck inside yesterday evening.",
    priority: Priority.HIGH,
    residentIndex: 1,
    createdDaysAgo: 7,
    steps: [{ to: ComplaintStatus.IN_PROGRESS, note: "Lift vendor called; technician visiting tomorrow.", afterDays: 1 }],
  },
  {
    category: Category.ELECTRICAL,
    title: "Corridor lights on 3rd floor not working",
    description: "All four corridor tube lights on the 3rd floor have been off for three days. The corridor is completely dark after 7 PM.",
    priority: Priority.MEDIUM,
    residentIndex: 2,
    createdDaysAgo: 6,
    steps: [{ to: ComplaintStatus.IN_PROGRESS, note: "Electrician has been assigned; replacement fittings ordered.", afterDays: 2 }],
  },
  {
    category: Category.SECURITY,
    title: "Main gate barrier left open at night",
    description: "The main gate barrier was left open past midnight on two occasions this week. Unregistered vehicles entered the compound.",
    priority: Priority.HIGH,
    residentIndex: 3,
    createdDaysAgo: 5,
    steps: [],
    flagged: true,
  },
  {
    category: Category.WATER,
    title: "Low water pressure in A wing on upper floors",
    description: "Water pressure on the 8th floor and above drops to almost nothing between 7 and 9 AM. The overhead tank pump may need servicing.",
    priority: Priority.MEDIUM,
    residentIndex: 0,
    createdDaysAgo: 4,
    steps: [{ to: ComplaintStatus.IN_PROGRESS, note: "Plumber inspected the pump; booster valve being replaced.", afterDays: 1 }],
  },
  {
    category: Category.HOUSEKEEPING,
    title: "Garbage not collected from B wing for two days",
    description: "The wet waste bins on the B wing ground floor have not been cleared since Saturday. There is a strong smell in the lobby.",
    priority: Priority.MEDIUM,
    residentIndex: 1,
    createdDaysAgo: 4,
    steps: [
      { to: ComplaintStatus.IN_PROGRESS, note: "Housekeeping supervisor informed.", afterDays: 1 },
      { to: ComplaintStatus.RESOLVED, note: "Collection resumed and schedule restored from today.", afterDays: 2 },
    ],
  },
  {
    category: Category.PARKING,
    title: "Visitor car parked in allotted slot A-14",
    description: "A visitor vehicle has been occupying my allotted slot A-14 since yesterday. I have had to park outside the compound.",
    priority: Priority.LOW,
    residentIndex: 2,
    createdDaysAgo: 3,
    steps: [{ to: ComplaintStatus.RESOLVED, note: "Vehicle traced through the visitor register and removed.", afterDays: 1 }],
  },
  {
    category: Category.COMMON_AREA,
    title: "Broken tiles near the children's play area",
    description: "Three paver tiles beside the swing set have come loose and one edge is sharp. It is a tripping hazard for small children.",
    priority: Priority.HIGH,
    residentIndex: 3,
    createdDaysAgo: 2,
    steps: [{ to: ComplaintStatus.IN_PROGRESS, note: "Area cordoned off; masonry work scheduled for the weekend.", afterDays: 1 }],
  },
  {
    category: Category.ELECTRICAL,
    title: "Generator does not start during power cuts",
    description: "During the outage on Tuesday the backup generator did not start at all. The building was without lifts for nearly an hour.",
    priority: Priority.HIGH,
    residentIndex: 0,
    createdDaysAgo: 2,
    steps: [],
  },
  {
    category: Category.PLUMBING,
    title: "Kitchen sink drains very slowly",
    description: "The kitchen sink in flat B-702 takes several minutes to drain and water backs up into the basin. Likely a blocked line.",
    priority: Priority.LOW,
    residentIndex: 1,
    createdDaysAgo: 1,
    steps: [],
  },
  {
    category: Category.HOUSEKEEPING,
    title: "Staircase between 5th and 6th floor not cleaned",
    description: "The staircase landing between the 5th and 6th floors has not been swept this week. There is dust and litter on the steps.",
    priority: Priority.LOW,
    residentIndex: 2,
    createdDaysAgo: 1,
    steps: [],
  },
  {
    category: Category.OTHER,
    title: "Intercom in flat C-1104 is dead",
    description: "The intercom handset has no dial tone. The security desk cannot reach us, so deliveries are being turned away at the gate.",
    priority: Priority.MEDIUM,
    residentIndex: 3,
    createdDaysAgo: 0,
    steps: [],
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@society.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";
  const residentPassword = "Resident@123";

  const admin = await prisma.user.create({
    data: {
      name: "Society Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      flatNumber: "Office",
      phone: "+91 98200 00000",
    },
  });

  const residentHash = await bcrypt.hash(residentPassword, 10);
  const residents = await Promise.all(
    [
      { name: "Rhea Menon", email: "rhea@example.com", flatNumber: "A-1203", phone: "+91 98200 11111" },
      { name: "Arjun Nair", email: "arjun@example.com", flatNumber: "B-702", phone: "+91 98200 22222" },
      { name: "Priya Deshmukh", email: "priya@example.com", flatNumber: "A-305", phone: "+91 98200 33333" },
      { name: "Karan Shah", email: "karan@example.com", flatNumber: "C-1104", phone: "+91 98200 44444" },
    ].map((r) => prisma.user.create({ data: { ...r, passwordHash: residentHash, role: "RESIDENT" } })),
  );

  console.log(`Created 1 admin and ${residents.length} residents.`);

  let seq = 0;
  for (const spec of SPECS) {
    seq += 1;
    const resident = residents[spec.residentIndex];
    const createdAt = daysAgo(spec.createdDaysAgo);

    // Walk the lifecycle so history mirrors exactly how the app would write it.
    let current: ComplaintStatus = ComplaintStatus.OPEN;
    let resolvedAt: Date | null = null;
    for (const step of spec.steps) {
      current = step.to;
      if (step.to === ComplaintStatus.RESOLVED) {
        resolvedAt = daysAgo(Math.max(0, spec.createdDaysAgo - step.afterDays), 15);
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        ticketNo: `SMT-${String(seq).padStart(4, "0")}`,
        residentId: resident.id,
        category: spec.category,
        title: spec.title,
        description: spec.description,
        priority: spec.priority,
        status: current,
        isOverdueFlagged: spec.flagged ?? false,
        createdAt,
        resolvedAt,
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        fromStatus: null,
        toStatus: ComplaintStatus.OPEN,
        note: "Complaint raised by resident",
        changedById: resident.id,
        createdAt,
      },
    });

    let previous: ComplaintStatus = ComplaintStatus.OPEN;
    for (const step of spec.steps) {
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: previous,
          toStatus: step.to,
          note: step.note,
          changedById: admin.id,
          createdAt: daysAgo(Math.max(0, spec.createdDaysAgo - step.afterDays), 15),
        },
      });
      previous = step.to;
    }
  }

  // Keep the ticket sequence in step with the seeded complaints.
  await prisma.setting.create({ data: { key: "complaint_seq", value: String(seq) } });
  await prisma.setting.create({ data: { key: "overdue_threshold_days", value: "3" } });

  console.log(`Created ${SPECS.length} complaints with full status history.`);

  await prisma.notice.createMany({
    data: [
      {
        title: "Water tank cleaning on Sunday, 9 AM to 2 PM",
        body:
          "The overhead and underground water tanks will be cleaned this Sunday. Water supply will be interrupted between 9 AM and 2 PM. Residents are requested to store enough water in advance.",
        isImportant: true,
        postedById: admin.id,
        createdAt: daysAgo(1, 9),
      },
      {
        title: "Monthly maintenance dues for this month",
        body:
          "Maintenance dues for the current month are payable by the 10th. Please collect your receipt from the society office after payment. Late payment attracts a 2% monthly charge.",
        isImportant: false,
        postedById: admin.id,
        createdAt: daysAgo(4, 11),
      },
      {
        title: "Annual general body meeting on the 28th",
        body:
          "The annual general body meeting will be held in the community hall at 6 PM on the 28th. The agenda covers the audited accounts, the lift AMC renewal and the parking policy revision.",
        isImportant: false,
        postedById: admin.id,
        createdAt: daysAgo(6, 18),
      },
    ],
  });

  console.log("Created 3 notices (1 important).");
  console.log("\nSeed complete. Sign in with:");
  console.log(`  Admin    : ${adminEmail} / ${adminPassword}`);
  console.log(`  Resident : rhea@example.com / ${residentPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
