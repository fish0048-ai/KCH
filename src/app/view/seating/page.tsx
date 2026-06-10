import { StudentSeatingView } from "@/components/seating/StudentSeatingView";

export default function StudentSeatingListPage() {
  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-slate-900">座位表（學生）</h1>
      <p className="mb-6 text-sm text-slate-600">
        無需登入，僅顯示教師已公布的座位表。
      </p>
      <StudentSeatingView />
    </div>
  );
}
