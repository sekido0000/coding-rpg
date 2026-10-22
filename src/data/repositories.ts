import "server-only";

import { createClient } from "@/lib/supabase/server";

export type RepositoryAwaitingCharacter = {
  id: string;
  owner: string;
  name: string;
};

type RepositoryRecord = {
  id: string;
  owner: string;
  name: string;
  characters:
    | { id: string }[]
    | { id: string }
    | null;
};

export async function getRepositoriesAwaitingCharacter(): Promise<
  RepositoryAwaitingCharacter[]
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("repositories")
    .select(`
      id,
      owner,
      name,
      characters (
        id
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not(
      "github_installation_id",
      "is",
      null,
    )
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `未設定リポジトリの取得に失敗しました: ${error.message}`,
    );
  }

  return (
    (data ?? []) as RepositoryRecord[]
  )
    .filter((repository) => {
      if (
        Array.isArray(
          repository.characters,
        )
      ) {
        return (
          repository.characters.length === 0
        );
      }

      return !repository.characters;
    })
    .map((repository) => ({
      id: repository.id,
      owner: repository.owner,
      name: repository.name,
    }));
}
