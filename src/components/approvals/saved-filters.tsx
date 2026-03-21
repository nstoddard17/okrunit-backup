"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Saved Filters: Dropdown to save, apply, and delete filters
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Filter, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { SavedFilter } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---- Types ----------------------------------------------------------------

interface SavedFiltersProps {
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
}

// ---- Component ------------------------------------------------------------

export function SavedFilters({ currentFilters, onApply }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [filterName, setFilterName] = useState("");

  // ---- Fetch saved filters on mount ---------------------------------------

  const fetchFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/saved-filters");
      if (!response.ok) {
        throw new Error("Failed to fetch saved filters");
      }
      const { data } = await response.json();
      setSavedFilters(data ?? []);
    } catch (error) {
      console.error("[SavedFilters] Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // ---- Save current filters -----------------------------------------------

  const handleSave = useCallback(async () => {
    const trimmedName = filterName.trim();
    if (!trimmedName) {
      toast.error("Please enter a name for the filter");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/v1/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          filters: currentFilters,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save filter");
      }

      const newFilter: SavedFilter = await response.json();
      setSavedFilters((prev) => [...prev, newFilter]);
      setFilterName("");
      setShowSaveInput(false);
      toast.success(`Filter "${trimmedName}" saved`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save filter",
      );
    } finally {
      setIsSaving(false);
    }
  }, [filterName, currentFilters]);

  // ---- Delete a saved filter ----------------------------------------------

  const handleDelete = useCallback(
    async (filterId: string, filterNameToDelete: string) => {
      try {
        const response = await fetch("/api/v1/saved-filters", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: filterId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to delete filter");
        }

        setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
        toast.success(`Filter "${filterNameToDelete}" deleted`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete filter",
        );
      }
    },
    [],
  );

  // ---- Apply a saved filter -----------------------------------------------

  const handleApply = useCallback(
    (filter: SavedFilter) => {
      onApply(filter.filters);
      toast.success(`Applied filter "${filter.name}"`);
    },
    [onApply],
  );

  // ---- Check if there are active filters to save --------------------------

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v !== undefined && v !== "" && v !== null,
  );

  // ---- Render -------------------------------------------------------------

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-4" />
          Saved Filters
          {savedFilters.length > 0 && (
            <span className="bg-primary text-primary-foreground ml-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
              {savedFilters.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && savedFilters.length === 0 && (
          <div className="px-2 py-3 text-center">
            <p className="text-muted-foreground text-sm">
              No saved filters yet.
            </p>
          </div>
        )}

        {/* Filter list */}
        {!isLoading && savedFilters.length > 0 && (
          <DropdownMenuGroup>
            {savedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center">
                <DropdownMenuItem
                  className="flex-1"
                  onClick={() => handleApply(filter)}
                >
                  {filter.is_default && (
                    <Star className="text-yellow-500 size-3" />
                  )}
                  <span className="truncate">{filter.name}</span>
                </DropdownMenuItem>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(filter.id, filter.name);
                  }}
                  className="cursor-pointer text-muted-foreground hover:text-destructive mr-2 p-1 transition-colors"
                  aria-label={`Delete filter "${filter.name}"`}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* Save current filters section */}
        {showSaveInput ? (
          <div className="space-y-2 p-2">
            <Input
              placeholder="Filter name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === "Escape") {
                  setShowSaveInput(false);
                  setFilterName("");
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={handleSave}
                disabled={isSaving || !filterName.trim()}
              >
                {isSaving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Save className="size-3" />
                )}
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setShowSaveInput(false);
                  setFilterName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            disabled={!hasActiveFilters}
            onClick={(e) => {
              e.preventDefault();
              setShowSaveInput(true);
            }}
          >
            <Save className="size-4" />
            Save current filters
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
