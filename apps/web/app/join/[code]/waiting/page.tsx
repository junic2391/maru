import { RoomId } from "@maru/shared-types";
import { WaitingRoom } from "./waiting-room";

export default async function Page(props: PageProps<"/join/[code]/waiting">) {
  const { code } = await props.params;
  const { roomId } = await props.searchParams;
  return <WaitingRoom code={code} roomId={roomId as RoomId} />;
}
