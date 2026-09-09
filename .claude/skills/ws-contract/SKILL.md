---
name: ws-contract
description: REST 엔드포인트와 WebSocket 이벤트 규약. Phase별로 계약이 다르다. 서버·클라이언트 연동 코드를 작성할 때 사용.
---

# ws-contract

원본: `/Users/junic/Documents/workspace/projects/maru-journal/source/Concept.md` **L578–632** (7.3 REST · 7.4 WebSocket · 7.4-b Phase별 차이). 페이로드 필드를 정확히 확인해야 하면 해당 라인을 직접 읽는다.

## 원칙

WebSocket 이벤트·REST 응답 타입은 **`@maru/shared-types`가 정본**이다. `apps/web`·`apps/server` 어느 쪽에서도 이 타입을 새로 정의하지 않는다. 이벤트를 추가하거나 바꿀 때는 `shared-types`부터 고친다.

## ⚠️ 계약은 Phase에 따라 다르다

**지금이 어느 Phase인지 먼저 확인한다.** 두 계약을 섞으면 안 된다.

| | **Phase 1 — 링크 초대만** | **Phase 2~ — 매칭 추가 (최종형)** |
|---|---|---|
| 모델 | `room` + `peer` | `session` + `match` |
| 형태 | `{ type: 'peer-joined', peerId }` 판별 유니온 | `match:paired` 콜론 네임스페이스 |
| 식별자 | `roomId`, `peerId` | `sessionId`, `peerId` |
| 근거 | Build-Phase0-1.md M1-02 | Concept.md 7.4 |

Phase 1에서 `sessionId`·`isInitiator`·매칭 이벤트를 미리 넣지 않는다. 연결이 안 될 때 원인이 시그널링인지 매칭인지 구분이 안 되기 때문이다(Plan 5-1 원칙 4).

### Phase 1 계약 (M1-02)

```typescript
export type ServerToClient =
  | { type: 'room-joined'; roomId: RoomId; peers: PeerId[] }
  | { type: 'peer-joined'; peerId: PeerId }
  | { type: 'peer-left';   peerId: PeerId }
  | { type: 'offer';  from: PeerId; sdp: string }
  | { type: 'answer'; from: PeerId; sdp: string }
  | { type: 'ice';    from: PeerId; candidate: RTCIceCandidateInit }
  | { type: 'error';  code: 'ROOM_FULL' | 'NOT_APPROVED' | 'INVALID_TOKEN' };
```

**서버는 SDP의 내용을 해석하지 않는다.** 시그널링 서버의 책임은 "A가 보낸 문자열을 같은 방의 B에게 전달"까지다. 불투명한 문자열로 다룬다.

### Phase 2 계약 (최종형)

| 방향 | 이벤트 | 용도 |
|---|---|---|
| C→S | `match:start` / `match:cancel` / `match:next` | 매칭 큐 진입·취소·다음 사람 |
| S→C | `match:queued` / `match:paired` / `match:failed` | 매칭 결과 |
| 양방향 | `signal:offer` / `signal:answer` / `signal:ice` | WebRTC 시그널링 |
| S→C | `peer:left` / `session:terminated` | 상대 이탈 / 강제 종료 |
| C→S | `heartbeat` | 큐 TTL 갱신 |

**`match:paired`의 `isInitiator`가 왜 필요한지**: 랜덤 매칭은 누가 offer를 보낼지 미리 정해져 있지 않다. 서버가 페어링 시점에 한쪽을 initiator로 지정해 양쪽이 동시에 offer를 보내는 glare를 막는다.

## REST 엔드포인트 (Concept 7.3, 요약)

- `POST /api/auth/social` · `POST /api/auth/age-confirm` — 로그인, 연령 확인 + EULA
- `DELETE /api/accounts/me` — 인앱 계정 삭제
- `POST /api/invite-rooms` · `GET /api/invite-rooms/:code` · `POST /api/invite-rooms/:code/guest` · `POST /api/invite-rooms/:id/approve` · `POST /api/invite-rooms/:id/revoke` — 링크 초대 방 생명주기
- `POST /api/sessions` — 통화 세션 발급
- `POST /api/translation/token` — ephemeral token
- `POST /api/reports` · `GET /api/sanctions/me` — 신고·제재
- `POST /api/metrics` · `GET /api/transcript/:sessionId`
