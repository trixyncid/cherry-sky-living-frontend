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
      {...(label ? { role: "img", "aria-label": label } : {})}
      aria-hidden={label ? undefined : true}
    >
      <Icon name="person" size={iconSize} />
    </div>
  );
}
