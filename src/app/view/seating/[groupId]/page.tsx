import { StudentSeatingView } from "@/components/seating/StudentSeatingView";
import { PageHeader } from "@/components/ui/PageHeader";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StudentSeatingGroupPage({ params }: PageProps) {
  const { groupId } = await params;
  const decoded = decodeURIComponent(groupId);
  return (
    <div>
      <PageHeader eyebrow="Student View" title="座位表檢視" description={`班級：${decoded}`} />
      <StudentSeatingView initialGroupId={decoded} />
    </div>
  );
}
