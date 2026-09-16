import { PeerId, RoomId } from "@maru/shared-types";
import { IDLE, reduce } from "./reduce";
import { CallState } from "./types";

const room = "r1" as RoomId;
const peer = "p1" as PeerId;
const T0 = 1_000_000;
const connecting: CallState = {
  status: "connecting",
  roomId: room,
  startedAt: T0,
};
const connected: CallState = {
  status: "connected",
  roomId: room,
  peerId: peer,
  connectedAt: T0,
};

describe("reduce — 정상 경로", () => {
  it("idle에서 JOIN하면 connecting이 된다", () => {
    expect(reduce(IDLE, { type: "JOIN", roomId: room }, T0)).toEqual(
      connecting,
    );
  });

  it("connecting에서 상대가 붙으면 connected가 된다", () => {
    const next = reduce(
      connecting,
      { type: "PEER_CONNECTED", peerId: peer },
      T0,
    );
    expect(next).toEqual(connected);
  });

  it("connected에서 나가면 통화 시간이 남는다", () => {
    const next = reduce(connected, { type: "LEAVE" }, T0 + 754_000);

    expect(next).toEqual({
      status: "ended",
      roomId: room,
      durationMs: 754_000,
    });
  });

  it("상대가 나가도 같은 종료 상태가 된다", () => {
    const byMe = reduce(connected, { type: "LEAVE" }, T0 + 5000);
    const byPeer = reduce(connected, { type: "PEER_LEFT" }, T0 + 5000);

    expect(byPeer).toEqual(byMe);
  });
});

describe("reduce — 재연결", () => {
  it("connected에서 끊기면 상대 정보를 들고 reconnecting으로 간다", () => {
    const next = reduce(connected, { type: "DISCONNECTED" }, T0 + 1000);

    expect(next).toEqual({
      status: "reconnecting",
      roomId: room,
      attempt: 1,
      peerId: peer,
      connectedAt: T0,
    });
  });

  it("재연결에 실패할 때마다 attempt가 오른다", () => {
    let state = reduce(connected, { type: "DISCONNECTED" }, T0);
    state = reduce(state, { type: "DISCONNECTED" }, T0);
    state = reduce(state, { type: "DISCONNECTED" }, T0);

    expect(state).toMatchObject({ status: "reconnecting", attempt: 3 });
  });

  it("재연결에 성공하면 통화 시간이 이어진다 — 새로 시작하지 않는다", () => {
    const dropped = reduce(connected, { type: "DISCONNECTED" }, T0 + 10_000);
    const back = reduce(
      dropped,
      { type: "PEER_CONNECTED", peerId: peer },
      T0 + 30_000,
    );

    expect(back).toEqual({
      status: "connected",
      roomId: room,
      peerId: peer,
      connectedAt: T0, // 끊기기 전 시각 그대로
    });

    const ended = reduce(back, { type: "LEAVE" }, T0 + 60_000);
    expect(ended).toMatchObject({ durationMs: 60_000 });
  });

  it("한 번도 연결된 적 없이 끊기면 재연결 성공 시각이 통화 시작이 된다", () => {
    const dropped = reduce(connecting, { type: "DISCONNECTED" }, T0);
    expect(dropped).toMatchObject({ peerId: null, connectedAt: null });

    const back = reduce(
      dropped,
      { type: "PEER_CONNECTED", peerId: peer },
      T0 + 5000,
    );
    expect(back).toMatchObject({ connectedAt: T0 + 5000 });
  });

  it("재연결을 포기하면 failed가 되고 사유가 남는다", () => {
    const dropped = reduce(connected, { type: "DISCONNECTED" }, T0);
    const failed = reduce(
      dropped,
      { type: "RETRY_FAILED", reason: "상한 초과" },
      T0,
    );

    expect(failed).toEqual({ status: "failed", reason: "상한 초과" });
  });

  it("통화가 시작되기 전에 재연결 중 나가면 종료 화면 없이 처음으로 돌아간다", () => {
    const dropped = reduce(connecting, { type: "DISCONNECTED" }, T0);

    expect(reduce(dropped, { type: "LEAVE" }, T0)).toEqual(IDLE);
  });
});

describe("reduce — 정의되지 않은 전이", () => {
  it("idle에서 통화 이벤트가 와도 상태가 그대로다", () => {
    for (const event of [
      { type: "PEER_CONNECTED", peerId: peer },
      { type: "DISCONNECTED" },
      { type: "PEER_LEFT" },
      { type: "LEAVE" },
    ] as const) {
      expect(reduce(IDLE, event, T0)).toBe(IDLE);
    }
  });

  it("늦게 도착한 PEER_CONNECTED는 이미 연결된 상태를 흔들지 않는다", () => {
    const other = "p2" as PeerId;
    expect(
      reduce(connected, { type: "PEER_CONNECTED", peerId: other }, T0),
    ).toBe(connected);
  });

  it("connecting 중 JOIN이 또 와도 무시한다", () => {
    expect(reduce(connecting, { type: "JOIN", roomId: room }, T0)).toBe(
      connecting,
    );
  });

  it("종료 후 JOIN하면 다시 걸 수 있다", () => {
    const ended = reduce(connected, { type: "LEAVE" }, T0 + 1000);
    const again = "r2" as RoomId;

    expect(reduce(ended, { type: "JOIN", roomId: again }, T0 + 2000)).toEqual({
      status: "connecting",
      roomId: again,
      startedAt: T0 + 2000,
    });
  });

  it("failed에서 LEAVE하면 처음으로 돌아간다", () => {
    const failed: CallState = { status: "failed", reason: "무엇이든" };
    expect(reduce(failed, { type: "LEAVE" }, T0)).toEqual(IDLE);
  });
});

describe("reduce — 불변성", () => {
  it("이전 상태를 고치지 않는다", () => {
    const before = { ...connected };
    reduce(connected, { type: "DISCONNECTED" }, T0 + 9999);

    expect(connected).toEqual(before);
  });

  it("시계를 거꾸로 돌려도 음수 통화 시간이 나오지 않는다", () => {
    const next = reduce(connected, { type: "LEAVE" }, T0 - 5000);
    expect(next).toMatchObject({ durationMs: 0 });
  });
});
