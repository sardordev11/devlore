import { createElement } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { ProfileTypeCount } from "@/lib/db/profile";
import { getTypeIcon } from "@/lib/type-icons";

interface TypeBreakdownProps {
  types: ProfileTypeCount[];
}

export function TypeBreakdown({ types }: TypeBreakdownProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {types.map((type) => (
          <div key={type.id} className="flex flex-col items-center gap-2 py-1">
            <div
              className="flex size-10 items-center justify-center rounded-lg"
              // Type colors are dynamic data; 1a = ~10% alpha on the hex color.
              style={{ backgroundColor: `${type.color}1a`, color: type.color }}
            >
              {createElement(getTypeIcon(type.icon), { className: "size-5" })}
            </div>
            <p className="text-xl font-semibold tabular-nums">{type.itemCount}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {type.name}s
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
