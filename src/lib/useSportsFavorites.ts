"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeagueKey } from "./sportsScores";

export interface FavoriteTeam {
  league: LeagueKey;
  teamId: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

const STORAGE_KEY = "stock-tracker:sports-favorites";

function load(): FavoriteTeam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSportsFavorites() {
  const [items, setItems] = useState<FavoriteTeam[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function hydrate() {
      setItems(load());
      setHydrated(true);
    }
    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addFavorite = useCallback((team: FavoriteTeam) => {
    setItems((prev) => {
      if (prev.some((t) => t.league === team.league && t.teamId === team.teamId)) return prev;
      return [...prev, team];
    });
  }, []);

  const removeFavorite = useCallback((league: LeagueKey, teamId: string) => {
    setItems((prev) => prev.filter((t) => !(t.league === league && t.teamId === teamId)));
  }, []);

  return { items, hydrated, addFavorite, removeFavorite };
}
