import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default async function Page() {
  const res = await fetch(`${API_URL}/rooms`, { method: "POST" });
  const { code, roomId } = (await res.json()) as {
    code: string;
    roomId: string;
  };
  redirect(`/room/${code}/host?roomId=${roomId}`);
}
