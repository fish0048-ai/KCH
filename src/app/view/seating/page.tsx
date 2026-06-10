import { StudentSeatingView } from "@/components/seating/StudentSeatingView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function StudentSeatingListPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Student View"
        title="座位表檢視"
        description="無需登入，僅顯示教師已公布的座位配置。"
      />
      <StudentSeatingView />
    </div>
  );
}
