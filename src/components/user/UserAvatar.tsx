import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

// "Brad Traversy" -> "BT", "brad@devlore.io" -> "B"
export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({
  name,
  email,
  image,
  size,
  className,
}: UserAvatarProps) {
  const displayName = name || email || "User";

  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt={displayName} />}
      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
    </Avatar>
  );
}
