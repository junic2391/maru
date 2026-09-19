import Link from "next/link";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default async function Page(props: PageProps<"/call/[roomId]/ended">) {
  const { duration } = await props.searchParams;
  const seconds = Number(duration ?? 0);

  return (
    <main
      style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}
    >
      <h2>대화가 끝났어요</h2>
      <p>{formatDuration(seconds)} 이야기했어요</p>
      <p>
        <Link href="/match">새로운 사람과 대화</Link>
      </p>
      <p>
        <Link href="/home">홈으로</Link>
      </p>
      <p>
        <Link href="/report/after">방금 대화에 문제가 있었나요? 신고하기 →</Link>
      </p>
    </main>
  );
}
