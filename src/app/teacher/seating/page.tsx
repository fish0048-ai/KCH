import { TeacherGuard } from "@/components/auth/TeacherGuard";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TeacherSeatingPage() {
  return (
    <TeacherGuard>
      <PageHeader
        eyebrow="Teacher Console"
        title="梅花座位表"
        description="編排座位、進行課堂互動。完成後按「公布給學生」，學生即可透過公開連結檢視。"
      />
      <SeatingWorkspace />
    </TeacherGuard>
  );
}
