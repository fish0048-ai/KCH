import { TeacherGuard } from "@/components/auth/TeacherGuard";
import { TeacherSeatingPageContent } from "@/components/seating/TeacherSeatingPageContent";

export default function TeacherSeatingPage() {
  return (
    <TeacherGuard>
      <TeacherSeatingPageContent />
    </TeacherGuard>
  );
}
