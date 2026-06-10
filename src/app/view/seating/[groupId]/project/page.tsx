import { StudentSeatingView } from "@/components/seating/StudentSeatingView";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StudentSeatingProjectPage({ params }: PageProps) {
  const { groupId } = await params;
  const decoded = decodeURIComponent(groupId);
  return <StudentSeatingView initialGroupId={decoded} projection />;
}
