import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ExamCorrectionRecord, UserProfile } from "../types/academic";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Enregistre le profil académique dans la base de données (non bloquant). */
export async function saveProfileToCloud(profile: UserProfile): Promise<void> {
  const id = await currentUserId();
  if (!id) return;
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: profile.firstName,
      academic_status: profile.status,
      grade_level: profile.gradeLevel ?? null,
      secondary_track: profile.secondaryTrack ?? null,
      university_id: profile.universityId ?? null,
      university_name: profile.universityName ?? null,
      program_id: profile.programId ?? null,
      faculty_code: profile.facultyCode ?? null,
      domain_pole: profile.domainPole ?? null,
      university_level: profile.universityLevel ?? null,
      specialty: profile.specialty ?? null,
      academic_goal: profile.academicGoal ?? null,
      onboarding_completed: true,
    })
    .eq("id", id);
  if (error) console.error("Profil non synchronisé :", error.message);
}

/** Recharge le profil depuis la base (nouvel appareil). */
export async function loadProfileFromCloud(): Promise<UserProfile | null> {
  const id = await currentUserId();
  if (!id) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data || !data.onboarding_completed || !data.first_name || !data.academic_status) return null;
  return {
    firstName: data.first_name,
    status: data.academic_status as UserProfile["status"],
    gradeLevel: data.grade_level ?? undefined,
    secondaryTrack: data.secondary_track ?? undefined,
    universityId: data.university_id ?? undefined,
    universityName: data.university_name ?? undefined,
    programId: data.program_id ?? undefined,
    facultyCode: data.faculty_code ?? undefined,
    domainPole: (data.domain_pole ?? undefined) as UserProfile["domainPole"],
    universityLevel: data.university_level ?? undefined,
    specialty: data.specialty ?? undefined,
    academicGoal: data.academic_goal ?? undefined,
    createdAt: data.created_at,
  };
}

/** Archive une correction dans l'historique en base (non bloquant). */
export async function saveCorrectionToCloud(record: ExamCorrectionRecord): Promise<void> {
  const id = await currentUserId();
  if (!id) return;
  const { error } = await supabase.from("exam_corrections").insert({
    user_id: id,
    subject_id: record.subjectId,
    subject_name: record.subjectName,
    source_mode: record.sourceMode,
    tier_at_creation: record.tierAtCreation,
    optical_score: record.opticalScore ?? null,
    title: (record as { title?: string }).title ?? null,
    correction: record as unknown as Json,
  });
  if (error) console.error("Correction non archivée :", error.message);
}
