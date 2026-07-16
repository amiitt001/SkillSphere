import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { checkJobEligibility, checkInternshipEligibility, checkGeneralEligibility } from '@/services/recommendations/eligibilityEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { type, requirements } = body;

    if (!type || !requirements) {
      return NextResponse.json({ error: 'Missing type or requirements parameter' }, { status: 400 });
    }

    const userDocSnap = await getDoc(doc(db, 'users', uid));
    if (!userDocSnap.exists() || !userDocSnap.data()?.unifiedProfile) {
      return NextResponse.json({ error: 'Profile not initialized' }, { status: 400 });
    }

    const profile = userDocSnap.data().unifiedProfile;
    const userYear = userDocSnap.data().year || '3rd Year';

    let eligibility;

    if (type === 'job') {
      const { experienceRequired, skillsRequired } = requirements;
      const userSkills = new Set(profile.skills.map((s: string) => s.toLowerCase()));
      const missingSkills = (skillsRequired || []).filter((s: string) => !userSkills.has(s.toLowerCase()));
      
      eligibility = checkJobEligibility(
        { experienceRequired: experienceRequired || 0 } as any,
        missingSkills,
        profile
      );
    } else if (type === 'internship') {
      const { academicYearTarget, skillsRequired } = requirements;
      const userSkills = new Set(profile.skills.map((s: string) => s.toLowerCase()));
      const missingSkills = (skillsRequired || []).filter((s: string) => !userSkills.has(s.toLowerCase()));

      eligibility = checkInternshipEligibility(
        { academicYearTarget: academicYearTarget || [] } as any,
        missingSkills,
        userYear
      );
    } else {
      const { level } = requirements;
      eligibility = checkGeneralEligibility(level || 'Intermediate', profile.skills.length);
    }

    return NextResponse.json({ success: true, eligibility });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
