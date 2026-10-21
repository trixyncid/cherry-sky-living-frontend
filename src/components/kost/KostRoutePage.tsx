"use client";

import { useTranslations } from "next-intl";
import { PropertyDetailView } from "@/components/kost/PropertyDetailView";
import { RoomDetailView } from "@/components/kost/RoomDetailView";
import { AppLayout } from "@/components/layout/AppLayout";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { isNotFoundApiError } from "@/lib/api/errors";
import { useKost } from "@/lib/hooks/use-kost-data";

type KostRoutePageProps = {
  kostId: string;
  roomTypeId?: string;
};

export function KostRoutePage({ kostId, roomTypeId }: KostRoutePageProps) {
  const t = useTranslations();
  const {
    data: kost,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useKost(kostId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-fg border-t-transparent" />
            <p className="text-fg-muted">{t("common.loading")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError && !isNotFoundApiError(error)) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <Icon
              name="error_outline"
              size={64}
              className="mx-auto mb-4 text-fg-muted"
            />
            <h2 className="mb-2 text-2xl font-medium tracking-tight text-fg">
              {t("propertyDetail.loadError")}
            </h2>
            <p className="mb-6 text-fg-muted">
              {t("propertyDetail.loadErrorDescription")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={isFetching}
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                <Icon name="refresh" size={20} />
                {t("common.tryAgain")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3 font-semibold text-fg transition-colors hover:bg-white"
              >
                <Icon name="home" size={20} />
                {t("roomDetail.backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!kost) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <Icon
              name="error"
              size={64}
              className="mx-auto mb-4 text-fg-muted"
            />
            <h2 className="mb-2 text-2xl font-medium tracking-tight text-fg">
              {t("propertyDetail.notFound")}
            </h2>
            <p className="mb-6 text-fg-muted">
              {t("propertyDetail.notFoundDescription")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <Icon name="home" size={20} />
              {t("roomDetail.backToHome")}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (roomTypeId) {
    return <RoomDetailView kost={kost} roomTypeId={roomTypeId} />;
  }

  return <PropertyDetailView kost={kost} />;
}
