import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { BoardClient } from "@/components/app/board/board-client";

export const metadata = { title: "Board — Momentum" };

export default async function BoardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <BoardClient />;
}
