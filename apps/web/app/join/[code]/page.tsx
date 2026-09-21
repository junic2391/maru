import Link from "next/link";
import { JoinForm } from "./join-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function linkErrorCopy(status: string): { title: string; body: string } {
  if (status === "consumed") {
    return {
      title: "이 링크는 이미 사용됐어요",
      body: "새 통화방을 만들어보세요",
    };
  }
  // expired, not-found 구분하지 않음
  return { title: "이 링크는 만료됐어요", body: "새 통화방을 만들어보세요" };
}

export default async function Page(props: PageProps<"/join/[code]">) {
  const { code } = await props.params;
  const res = await fetch(`${API_URL}/rooms/by-code/${code}`, { cache: "no-store" });
  const { status } = (await res.json()) as { status: string };

  if (status !== "ok") {
    const copy = linkErrorCopy(status);
    return (
      <main
        style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}
      >
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
        <p>
          <Link href="/">시작하기</Link>
        </p>
        <p style={{ fontSize: 12, color: "#6B6478" }}>
          Maru는 랜덤으로도 대화할 수 있어요
        </p>
      </main>
    );
  }

  return <JoinForm code={code} />;
}
