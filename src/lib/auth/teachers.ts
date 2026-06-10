export function getTeacherEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_TEACHER_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isTeacherEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const teachers = getTeacherEmails();
  if (teachers.length === 0) return false;
  return teachers.includes(email.trim().toLowerCase());
}
