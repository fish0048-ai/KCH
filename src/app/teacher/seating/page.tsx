import { TeacherGuard } from "@/components/auth/TeacherGuard";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";

export default function TeacherSeatingPage() {
  return (
    <TeacherGuard>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">梅花座位表（教師）</h1>
        <p className="text-sm text-slate-600">
          編排完成後，請按「公布給學生」讓學生透過公開連結檢視。
        </p>
      </div>
      <SeatingWorkspace />
    </TeacherGuard>
  );
}
