import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db.js';
import { encryptField, hashSha256 } from '../src/utils/crypto.js';
import { recomputePatientRisk } from '../src/riskEngine/riskEngine.js';
import { ENV } from '../src/config/env.js';

const DEMO_PIN = '1234';

async function seed() {
  console.log('=======================================================');
  console.log(' Starting Saathi Database Seeding...');
  console.log('=======================================================\n');

  // 1. Seed API Keys
  console.log('1. Seeding API Keys...');
  const apiKeysConfig = [
    {
      name: 'Mobile Web & Counsellor Portal',
      type: 'FRONTEND' as const,
      rawKey: ENV.FRONTEND_API_KEY,
      scopes: ['frontend'],
      rateLimit: 300,
    },
    {
      name: 'IVR & Telephony Provider Callback',
      type: 'IVR_WEBHOOK' as const,
      rawKey: ENV.IVR_API_KEY,
      scopes: ['ivr_webhook'],
      rateLimit: 120,
    },
    {
      name: 'Supervisor & Admin Management Tool',
      type: 'ADMIN_TOOL' as const,
      rawKey: ENV.ADMIN_API_KEY,
      scopes: ['admin_tool'],
      rateLimit: 300,
    },
  ];

  for (const k of apiKeysConfig) {
    const keyHash = hashSha256(k.rawKey);
    await prisma.apiKey.upsert({
      where: { keyHash },
      update: {
        name: k.name,
        type: k.type,
        scopes: JSON.stringify(k.scopes),
        rateLimit: k.rateLimit,
        isActive: true,
      },
      create: {
        name: k.name,
        type: k.type,
        keyHash,
        scopes: JSON.stringify(k.scopes),
        rateLimit: k.rateLimit,
        isActive: true,
      },
    });
  }

  // 2. Seed Users: 1 Supervisor + 8 Counsellors
  console.log('2. Seeding Supervisor & 8 Counsellors...');
  const defaultPasswordHash = await bcrypt.hash('saathi123', 10);
  const pinHash = await bcrypt.hash(DEMO_PIN, 10);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@saathi.care' },
    update: {},
    create: {
      email: 'supervisor@saathi.care',
      name: 'Dr. Meenakshi Sundaram',
      passwordHash: defaultPasswordHash,
      role: 'SUPERVISOR',
      district: 'South Delhi TB Division Hub',
    },
  });

  const counsellorsData = [
    { name: 'Sunita Rao', email: 'sunita.rao@saathi.care', district: 'South Delhi - Chirag Delhi TB Unit' },
    { name: 'Rajesh Verma', email: 'rajesh.verma@saathi.care', district: 'South Delhi - Lajpat Nagar Clinic' },
    { name: 'Priya Sharma', email: 'priya.sharma@saathi.care', district: 'South Delhi - Kalkaji PHC' },
    { name: 'Amit Patel', email: 'amit.patel@saathi.care', district: 'South Delhi - Mehrauli Dispensary' },
    { name: 'Neha Singh', email: 'neha.singh@saathi.care', district: 'South Delhi - Hauz Khas Dispensary' },
    { name: 'Kavita Nair', email: 'kavita.nair@saathi.care', district: 'South Delhi - Malviya Nagar PHC' },
    { name: 'Mohd. Farhan', email: 'mohd.farhan@saathi.care', district: 'South Delhi - Okhla Health Post' },
    { name: 'Deepa Joshi', email: 'deepa.joshi@saathi.care', district: 'South Delhi - Saket Clinic' },
  ];

  const counsellors = [];
  for (const c of counsellorsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        passwordHash: defaultPasswordHash,
        role: 'COUNSELLOR',
        district: c.district,
      },
    });
    counsellors.push(user);
  }

  const primaryCounsellor = counsellors[0]; // Sunita Rao

  // 3. Seed Demo Patients Matching Frontend UI
  console.log('3. Seeding UI Demo Patients...');
  const demoPatients = [
    {
      code: 'P-0142',
      firstName: 'Anita',
      lastName: 'Sharma',
      phone: '9876543210',
      age: 32,
      gender: 'Female',
      phase: 'CONTINUATION' as const,
      monthNumber: 4,
      regimen: '3-FDC Daily (Rifampicin, Isoniazid, Ethambutol)',
      phcLocation: 'Chirag Delhi PHC',
      distanceToClinicKm: 8.5,
      reminderTime: '08:30',
      assignedCounsellorId: primaryCounsellor.id,
      sideEffects: ['sick', 'stomach'],
      sideEffectNotes: 'Dizziness after morning meal and stomach discomfort',
      consecutiveMisses: 1,
      targetRiskScore: 84,
      targetRiskLevel: 'HIGH' as const,
      oneLineReason: '3 missed in last 5 days',
    },
    {
      code: 'P-0089',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      phone: '9412378901',
      age: 44,
      gender: 'Male',
      phase: 'CONTINUATION' as const,
      monthNumber: 3,
      regimen: '3-FDC Daily',
      phcLocation: 'Lajpat Nagar Clinic',
      distanceToClinicKm: 2.1,
      reminderTime: '07:30',
      assignedCounsellorId: primaryCounsellor.id,
      consecutiveMisses: 1,
      targetRiskScore: 58,
      targetRiskLevel: 'MEDIUM' as const,
      oneLineReason: 'Missed yesterday, streak broken',
    },
    {
      code: 'P-0204',
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '9811233445',
      age: 28,
      gender: 'Male',
      phase: 'INTENSIVE' as const,
      monthNumber: 2,
      regimen: '4-FDC Daily',
      phcLocation: 'Mehrauli Dispensary',
      distanceToClinicKm: 6.0,
      reminderTime: '08:00',
      assignedCounsellorId: primaryCounsellor.id,
      consecutiveMisses: 2,
      unansweredCalls: 2,
      targetRiskScore: 91,
      targetRiskLevel: 'HIGH' as const,
      oneLineReason: '4 missed in last 6 days, unreachable',
    },
    {
      code: 'P-0118',
      firstName: 'Sunita',
      lastName: 'Devi',
      phone: '9718822334',
      age: 50,
      gender: 'Female',
      phase: 'CONTINUATION' as const,
      monthNumber: 5,
      regimen: '3-FDC Daily',
      phcLocation: 'Kalkaji PHC',
      distanceToClinicKm: 1.5,
      reminderTime: '09:00',
      assignedCounsellorId: primaryCounsellor.id,
      sideEffects: ['tired', 'other'],
      sideEffectNotes: 'Mild knee joint pain after morning walking',
      targetRiskScore: 61,
      targetRiskLevel: 'MEDIUM' as const,
      oneLineReason: 'Delayed submission, reported joint pain',
    },
    {
      code: 'P-0177',
      firstName: 'Mohd.',
      lastName: 'Imran',
      phone: '9953144556',
      age: 39,
      gender: 'Male',
      phase: 'CONTINUATION' as const,
      monthNumber: 4,
      regimen: '3-FDC Daily',
      phcLocation: 'Okhla Health Post',
      distanceToClinicKm: 3.4,
      reminderTime: '08:15',
      assignedCounsellorId: primaryCounsellor.id,
      targetRiskScore: 79,
      targetRiskLevel: 'HIGH' as const,
      oneLineReason: 'Refill overdue by 3 days',
    },
    {
      code: 'P-0056',
      firstName: 'Pooja',
      lastName: 'Verma',
      phone: '9871099887',
      age: 24,
      gender: 'Female',
      phase: 'INTENSIVE' as const,
      monthNumber: 1,
      regimen: '4-FDC Daily',
      phcLocation: 'Hauz Khas Dispensary',
      distanceToClinicKm: 1.2,
      reminderTime: '08:00',
      assignedCounsellorId: primaryCounsellor.id,
      targetRiskScore: 19,
      targetRiskLevel: 'LOW' as const,
      oneLineReason: '100% adherence, 28-day streak',
    },
    {
      code: 'P-0221',
      firstName: 'Gopal',
      lastName: 'Krishnan',
      phone: '9845011223',
      age: 58,
      gender: 'Male',
      phase: 'CONTINUATION' as const,
      monthNumber: 6,
      regimen: '3-FDC Daily',
      phcLocation: 'Malviya Nagar PHC',
      distanceToClinicKm: 4.8,
      reminderTime: '07:00',
      assignedCounsellorId: primaryCounsellor.id,
      targetRiskScore: 35,
      targetRiskLevel: 'LOW' as const,
      oneLineReason: 'Consistently adherent',
    },
  ];

  const now = new Date();
  const createdDemoPatients = [];

  for (const dp of demoPatients) {
    const phoneHash = hashSha256(dp.phone);
    const patient = await prisma.patient.upsert({
      where: { code: dp.code },
      update: {},
      create: {
        code: dp.code,
        firstName: dp.firstName,
        lastName: dp.lastName,
        phoneEncrypted: encryptField(`+91 ${dp.phone}`),
        phoneHash,
        age: dp.age,
        gender: dp.gender,
        phase: dp.phase,
        monthNumber: dp.monthNumber,
        regimen: dp.regimen,
        phcLocation: dp.phcLocation,
        distanceToClinicKm: dp.distanceToClinicKm,
        reminderTime: dp.reminderTime,
        pinHash,
        assignedCounsellorId: dp.assignedCounsellorId,
        consentGiven: true,
      },
    });
    createdDemoPatients.push(patient);

    // Seed side effects if defined
    if (dp.sideEffects) {
      await prisma.sideEffectReport.create({
        data: {
          patientId: patient.id,
          symptoms: JSON.stringify(dp.sideEffects),
          freeTextEncrypted: dp.sideEffectNotes ? encryptField(dp.sideEffectNotes) : null,
          severityFlag: true,
          createdAt: new Date(now.getTime() - 2 * 86400000),
        },
      });
    }

    // Seed follow-up calls
    if (dp.unansweredCalls) {
      for (let i = 0; i < dp.unansweredCalls; i++) {
        await prisma.followup.create({
          data: {
            patientId: patient.id,
            counsellorId: dp.assignedCounsellorId,
            reason: 'Consecutive missed doses check',
            outcome: 'NO_ANSWER',
            notesEncrypted: encryptField('Phone switched off. Second attempt in 48 hours.'),
            loggedAt: new Date(now.getTime() - (i + 1) * 86400000),
          },
        });
      }
    } else {
      await prisma.followup.create({
        data: {
          patientId: patient.id,
          counsellorId: dp.assignedCounsellorId,
          reason: 'Routine adherence check',
          outcome: 'REACHED',
          notesEncrypted: encryptField('Patient reassured about medication timing.'),
          loggedAt: new Date(now.getTime() - 3 * 86400000),
        },
      });
    }

    // Seed 90 days checkin history for demo patients
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - dayOffset);
      const dateStr = checkDate.toISOString().slice(0, 10);

      let isMissed = false;
      if (dp.code === 'P-0142' && dayOffset >= 1 && dayOffset <= 3) isMissed = true;
      if (dp.code === 'P-0089' && dayOffset === 1) isMissed = true;
      if (dp.code === 'P-0204' && dayOffset >= 1 && dayOffset <= 4) isMissed = true;
      if (dp.code === 'P-0056') isMissed = false; // 100% adherence

      if (!isMissed && dayOffset > 0) {
        await prisma.checkin.upsert({
          where: { patientId_date: { patientId: patient.id, date: dateStr } },
          update: {},
          create: {
            patientId: patient.id,
            date: dateStr,
            method: 'PHOTO',
            status: 'CHECKED_IN',
            photoUrl: '/uploads/photos/demo_blister_strip.jpg',
            submittedAt: checkDate,
          },
        });
      }
    }
  }

  // 4. Seed Remaining Cohort Patients to reach 200 patients total
  console.log('4. Seeding remaining synthetic cohort patients (Total 200)...');
  const totalTarget = 200;
  const currentCount = await prisma.patient.count();
  const needed = totalTarget - currentCount;

  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anika', 'Navya', 'Angel', 'Myra', 'Sara', 'Rohan', 'Sneha', 'Manish', 'Kiran', 'Suresh', 'Lata', 'Deepak', 'Geeta', 'Sanjay', 'Rekha'];
  const lastNames = ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Yadav', 'Gupta', 'Joshi', 'Mishra', 'Nair', 'Das', 'Roy', 'Choudhury', 'Reddy', 'Rao'];
  const locations = ['Chirag Delhi PHC', 'Lajpat Nagar Clinic', 'Kalkaji PHC', 'Mehrauli Dispensary', 'Hauz Khas Dispensary', 'Malviya Nagar PHC', 'Okhla Health Post', 'Saket Clinic'];

  for (let i = 1; i <= needed; i++) {
    const codeNum = currentCount + i;
    const code = `P-${String(codeNum).padStart(4, '0')}`;
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const phone = `9${String(100000000 + i * 4919).slice(0, 9)}`;
    const phoneHash = hashSha256(phone);
    const counsellor = counsellors[i % counsellors.length];
    const isIntensive = i % 3 === 0;

    const patient = await prisma.patient.create({
      data: {
        code,
        firstName: fName,
        lastName: lName,
        phoneEncrypted: encryptField(`+91 ${phone}`),
        phoneHash,
        age: 20 + (i % 50),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phase: isIntensive ? 'INTENSIVE' : 'CONTINUATION',
        monthNumber: isIntensive ? (i % 2) + 1 : (i % 5) + 1,
        regimen: isIntensive ? '4-FDC Daily' : '3-FDC Daily',
        phcLocation: locations[i % locations.length],
        distanceToClinicKm: parseFloat((1.0 + (i % 12) * 0.7).toFixed(1)),
        reminderTime: `0${7 + (i % 3)}:00`,
        pinHash,
        assignedCounsellorId: counsellor.id,
        consentGiven: true,
      },
    });

    // 90 days checkin history with ~82% adherence
    const checkinDays = 90;
    for (let dayOffset = 1; dayOffset <= checkinDays; dayOffset++) {
      // Adherence probability ~82%
      const willCheckIn = (i * 7 + dayOffset * 13) % 100 < 82;

      if (willCheckIn) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - dayOffset);
        const dateStr = checkDate.toISOString().slice(0, 10);

        await prisma.checkin.create({
          data: {
            patientId: patient.id,
            date: dateStr,
            method: dayOffset % 5 === 0 ? 'IVR' : 'PHOTO',
            status: 'CHECKED_IN',
            photoUrl: dayOffset % 5 === 0 ? undefined : '/uploads/photos/demo_blister_strip.jpg',
            submittedAt: checkDate,
          },
        });
      }
    }
  }

  // 5. Recompute Initial Risk Scores for the Cohort
  console.log('5. Computing initial Explainable Risk Scores for all patients...');
  const allPatients = await prisma.patient.findMany({ select: { id: true } });
  for (const p of allPatients) {
    try {
      await recomputePatientRisk(p.id);
    } catch {}
  }

  console.log('\n=======================================================');
  console.log(' SEEDING COMPLETED SUCCESSFULLY!');
  console.log(' Total Patients Seeded:   ', allPatients.length);
  console.log(' Total Counsellors:       ', counsellors.length);
  console.log(' Total Supervisors:       ', 1);
  console.log(' Cohort Adherence Target: ~82%');
  console.log(' Default PIN for patients: 1234');
  console.log(' Counsellor / Admin Pass:  saathi123');
  console.log('-------------------------------------------------------');
  console.log(' Demo Accounts:');
  console.log(' - Supervisor: supervisor@saathi.care / saathi123');
  console.log(' - Counsellor: sunita.rao@saathi.care / saathi123');
  console.log(' - Patient Anita (HIGH):  Phone 9876543210 / PIN 1234');
  console.log(' - Patient Ramesh (MED):  Phone 9412378901 / PIN 1234');
  console.log(' - Patient Vikram (HIGH): Phone 9811233445 / PIN 1234');
  console.log('=======================================================\n');
}

seed()
  .catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
