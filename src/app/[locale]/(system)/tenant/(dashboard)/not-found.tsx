import { ErrorState } from "@/components/shared/error-state";

export default function TenantPortalNotFound() {
  return <ErrorState variant="notFound" homeHref="/tenant" />;
}
