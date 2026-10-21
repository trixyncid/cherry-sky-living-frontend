import { PettyCashForm } from "@/features/admin/petty-cash/petty-cash-form";

export default async function EditPettyCashEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PettyCashForm id={id} />;
}
