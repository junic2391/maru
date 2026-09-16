---
name: security-checklist
description: Concept.md 9장(보안·프라이버시·안전)과 일반 프론트엔드 보안 원칙(XSS·CSRF·CSP) 체크리스트. 인증·토큰·신고·API 핸들러 등 보안이 걸린 코드를 작성하거나 PR 직전 점검할 때 사용.
---

# security-checklist

원본: `/Users/junic/Documents/workspace/projects/maru-journal/source/Concept.md` **L660–788** (9장 보안·프라이버시·안전). Phase 3~6 작업(토큰 발급, TURN, 신고·제재, 스토어 심사) 시작 전 반드시 원본을 다시 읽는다.

## 이 스킬의 범위

Concept.md 9장은 **maru 도메인에 특화된 보안 결정**(ephemeral token, P2P IP 노출, 신고·제재)을 다룬다. 반면 XSS·CSRF·CSP 같은 **일반 웹 프론트엔드 보안 원칙**은 이 프로젝트 문서 어디에도 아직 체계적으로 정리돼 있지 않다 — 아래 표의 오른쪽 열이 비어 있으면 그 뜻이다. 점검 시 근거 없는 "충족"을 만들어내지 않는다.

## maru 특화 보안 결정 (Concept 9장, 문서화됨)

| 항목 | 설계 | 근거 |
|---|---|---|
| API 키 보호 (ephemeral token) | 1회용, 만료 30분 이내. 토큰 발급 API에 rate limit + 유효 세션 검증 필수 | Concept 9.1 (L662) → ADR-007 |
| 데이터 최소화 | 대화 내용 미저장(자막은 클라이언트 메모리만), 계정·이메일·전화번호 미수집, 신고 기록은 디바이스 해시만 | Concept 9.2 (L669) |
| P2P IP 노출 방지 | 랜덤 매칭 = `iceTransportPolicy: 'relay'`(TURN 강제), 링크 초대 = `'all'`(P2P 직결) | Concept 9.3 (L678) → ADR-013 |
| 연령 확인 한계 인정 | 자기 신고식 확인은 우회 가능함을 README에 명시 | Concept 9.4-① (L697) → ADR-010 |
| 신고·차단·쿨다운 | 신고 즉시 연결 해제 + 재매칭 차단, 디바이스 해시 기준 쿨다운 | Concept 9.4-②③ (L697) |
| 클라이언트측 콘텐츠 모더레이션 한계 | 브라우저 내 판정은 코드 수정으로 우회 가능함을 README·리뷰어 노트에 명시, 신고 기반 사후 대응이 주 방어선 | Concept 9.5 (L723) → ADR-012 |
| 링크 초대 악용 방지 | 대기실 승인, 1회용 링크, 초대방 생성 횟수 제한, 호스트 책임 원칙(EULA) | Concept 9.6 (L740) → ADR-018 |

## 일반 프론트엔드 보안 체크리스트 (문서에 없음 — 구현 시점에 직접 판단)

컬리 핀테크/커머스 JD가 요구하는 "XSS/CSRF/CSP/시큐어 코딩" 이해를 maru 코드에 적용할 때 확인하는 항목. Concept.md에 대응하는 절이 없으므로, 점검 시 **레포의 실제 구현을 찾아서** 판단한다 — 원칙만 보고 충족으로 단정하지 않는다.

| 항목 | 확인 대상 |
|---|---|
| XSS | 사용자 입력(닉네임, 신고 사유, 초대방 이름 등)이 `dangerouslySetInnerHTML` 등으로 그대로 렌더링되지 않는가 |
| CSRF | 상태 변경 API(신고, 계정 삭제, 초대방 생성 등)가 쿠키 기반 세션이라면 CSRF 토큰 또는 `SameSite` 쿠키 정책이 있는가 |
| CSP | `next.config`/응답 헤더에 CSP가 설정돼 있고 `unsafe-inline`을 불필요하게 허용하지 않는가 |
| 토큰 만료·재발급 | ephemeral token(ADR-007), TURN 자격증명(ADR-013)의 TTL과 재발급 로직이 Concept 9.1·9.3과 실제로 일치하는가 |
| Rate limit | 토큰 발급 API·신고 API에 남용 방지가 걸려 있는가 (Concept 9.1) |
| 민감정보 로깅 | 에러 트래킹·로그(관측 체계)에 개인정보·토큰 원문·자막 내용이 찍히지 않는가 (Concept 9.2 데이터 최소화 원칙 위반 여부) |

## 사용 방법

`/security-check` 커맨드가 위 두 표를 기준으로 레포 구현을 대조해 충족/미충족 표를 출력한다. 코드를 작성하는 시점에는 이 스킬을 참고용으로만 쓰고, 실제 점검은 기능이 끝난 뒤 `/security-check`로 몰아서 한다.
