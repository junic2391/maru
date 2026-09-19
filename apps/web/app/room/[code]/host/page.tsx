import { RoomId } from "@maru/shared-types";
import { HostRoom } from "./host-room";

export default async function Page(props: PageProps<"/room/[code]/host">) {
    const {code} = await props.params;
    const {roomId} = await props.searchParams;
    return <HostRoom code={code} roomId={roomId as RoomId} />
}