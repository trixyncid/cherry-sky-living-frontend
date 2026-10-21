import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

type ProfileAvatarPlaceholderProps = {
  className?: string;
  iconSize?: number;
  label?: string;
};

export function ProfileAvatarPlaceholder({
  className,
  iconSize = 24,
  label,
}: ProfileAvatarPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hover text-fg-muted",
        className,
      )}
      aria-label={label}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
    >
      <Icon name="person" size={iconSize} />
    </div>
  );
}
