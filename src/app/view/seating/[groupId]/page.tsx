import { StudentSeatingView } from "@/components/seating/StudentSeatingView";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StudentSeatingGroupPage({ params }: PageProps) {
  const { groupId } = await params;
  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-slate-900">座位表（學生）</h1>
      <p className="mb-6 text-sm text-slate-600">班級：{decodeURIComponent(groupId)}</p>
      <StudentSeatingView initialGroupId={decodeURIComponent(groupId)} />
    </div>
  );
}
