"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeagueKey } from "@/lib/sportsScores";
import type { TeamOption } from "@/lib/sportsTeams";
import type { FavoriteTeam } from "@/lib/useSportsFavorites";

const LEAGUE_OPTIONS: { key: LeagueKey; label: string }[] = [
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "nhl", label: "NHL" },
  { key: "soccer", label: "Soccer" },
  { key: "ncaaf", label: "NCAAF" },
  { key: "mlb", label: "MLB" },
];

export function AddFavoriteTeamForm({
  favorites,
  onAdd,
}: {
  favorites: FavoriteTeam[];
  onAdd: (team: FavoriteTeam) => void;
}) {
  const [league, setLeague] = useState<LeagueKey>("nfl");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let cancelled = false;

    function reset() {
      setLoading(true);
      setSelected("");
    }
    reset();

    fetch(`/api/sports-teams?league=${league}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTeams((data.teams ?? []) as TeamOption[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [league]);

  const favoriteIds = useMemo(
    () => new Set(favorites.filter((f) => f.league === league).map((f) => f.teamId)),
    [favorites, league]
  );
  const available = useMemo(() => teams.filter((t) => !favoriteIds.has(t.id)), [teams, favoriteIds]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const team = available.find((t) => t.id === selected);
    if (!team) return;
    onAdd({ league, teamId: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logo });
    setSelected("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-xs text-foreground/50">
        League
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value as LeagueKey)}
          className="mt-0.5 w-32 rounded border border-foreground/15 bg-white px-2 py-1.5 text-sm text-black"
        >
          {LEAGUE_OPTIONS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-xs text-foreground/50">
        Team
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-0.5 w-56 rounded border border-foreground/15 bg-white px-2 py-1.5 text-sm text-black"
        >
          <option value="" disabled>
            {loading ? "Loading…" : "Select a team"}
          </option>
          {available.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={!selected}
        className="rounded bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Add team
      </button>
    </form>
  );
}
