import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// 방을 매번 새로 만드는 부수효과가 있는 페이지다 — 빌드 시점에 정적으로
// 미리 렌더링(그리고 그 fetch를 실행)하면 안 된다.
export const dynamic = "force-dynamic";

export default async function Page() {
  const res = await fetch(`${API_URL}/rooms`, { method: "POST" });
  const { code, roomId } = (await res.json()) as {
    code: string;
    roomId: string;
  };
  redirect(`/room/${code}/host?roomId=${roomId}`);
}
