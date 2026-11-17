import { ErrorState } from "@/components/shared/error-state";

export default function AdminPortalNotFound() {
  return <ErrorState variant="notFound" homeHref="/admin" />;
}
