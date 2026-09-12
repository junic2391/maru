import { RoomId } from "@maru/shared-types";
import { CallRoom } from "./call-room";

export default async function Page(props: PageProps<"/call/[roomId]">) {
  const { roomId } = await props.params;
  return <CallRoom roomId={roomId as RoomId} />;
}
