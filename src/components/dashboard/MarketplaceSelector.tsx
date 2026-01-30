import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Marketplace {
  id: string;
  name: string;
  description: string;
  color: string;
}

const MARKETPLACES: Marketplace[] = [
  {
    id: "adobe",
    name: "Adobe Stock",
    description: "Premium stock marketplace",
    color: "bg-red-500",
  },
  {
    id: "shutterstock",
    name: "Shutterstock",
    description: "Global stock platform",
    color: "bg-orange-500",
  },
  {
    id: "freepik",
    name: "Freepik",
    description: "Creative resources hub",
    color: "bg-blue-500",
  },
];

interface MarketplaceSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MarketplaceSelector({
  selected,
  onChange,
}: MarketplaceSelectorProps) {
  const toggleMarketplace = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    if (selected.length === MARKETPLACES.length) {
      onChange([]);
    } else {
      onChange(MARKETPLACES.map((m) => m.id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">Select Marketplaces</h3>
        <button
          onClick={selectAll}
          className="text-sm font-medium text-secondary hover:underline"
        >
          {selected.length === MARKETPLACES.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {MARKETPLACES.map((marketplace) => {
          const isSelected = selected.includes(marketplace.id);
          return (
            <button
              key={marketplace.id}
              onClick={() => toggleMarketplace(marketplace.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-secondary bg-secondary/5"
                  : "border-border/60 bg-card hover:border-secondary/30 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  marketplace.color
                )}
              >
                <span className="text-lg font-bold text-white">
                  {marketplace.name[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{marketplace.name}</p>
                <p className="text-xs text-muted-foreground">
                  {marketplace.description}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  isSelected
                    ? "border-secondary bg-secondary"
                    : "border-border bg-transparent"
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Select at least one marketplace to generate metadata
        </p>
      )}
    </div>
  );
}

export { MARKETPLACES };
