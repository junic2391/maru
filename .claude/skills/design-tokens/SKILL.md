---
name: design-tokens
description: Design.md 6~9장의 컬러·타이포·스페이싱·라운드·모션 토큰 규칙. UI 컴포넌트를 만들거나 스타일을 정할 때 사용.
---

# design-tokens

원본: `/Users/junic/Documents/workspace/projects/maru-journal/source/Design.md` **L556–769** (6장 컬러 · 7장 타이포그래피 · 8장 여백/라운드/엘리베이션 · 9장 모션). 전체 토큰 CSS는 15장(L1002~). 정확한 값이 필요하면 해당 라인을 직접 읽는다.

## 핵심 규칙 (요약)

- **컬러 3계층**: primitive(값) → semantic(역할, `--color-primary` 등) → component(쓰임, `--button-primary-bg` 등). 컴포넌트는 **semantic 토큰만** 참조하고 primitive 값을 직접 쓰지 않는다.
- 버튼 기본 배경은 Coral **700**(`#C93850`, 대비 5.04:1)이다. 브랜드 기준색 500(`#FF5C72`)은 그라디언트·로고 등 장식 전용 — 흰 텍스트와 함께 버튼에 쓰면 WCAG AA(4.5:1) 미달.
- **다크 모드 버튼 텍스트는 흰색이 아니라 Dusk Ink(`#1C1830`)**다. 다크 모드는 300 단계(밝은 값)를 배경으로 쓰므로 어두운 텍스트라야 대비가 나온다.
- 타이포: Display(RIDIBatang, 세리프)는 랜딩 히어로·섹션 타이틀에만. 그 외 전부 Pretendard Variable. `subtitle` 20px·`body` 16px는 어떤 화면에서도 하한.
- 스페이싱은 4px 단위(`space-1`=4px ~ `space-20`=80px). 버튼 패딩 12/24px, 인풋 패딩 14/16px, 카드 패딩 24px 고정.
- 라운드는 **역할을 나타낸다**: `radius-full`(999px, pill)은 지금 누를 행동(버튼·토글)에만, `radius-md`(16px)는 컨테이너(카드)에만. 기계적으로 통일하지 않는다.
- 그림자는 실제로 "떠 있는" 요소(통화 컨트롤 바, 모달)에만 쓴다. 카드 기본값은 그림자 없이 테두리로만 구분.
- **Tailwind v4다.** `tailwind.config.ts`는 없고 `apps/web/app/globals.css`의 `@theme` 블록이 그 역할을 한다. v3의 `theme.extend.colors` 예제를 그대로 쓰면 동작하지 않는다.
- **자막은 애니메이션하지 않는다** — 즉시 표시, 불투명도만 partial→final 전환. 화면 전환은 페이드만(슬라이드·스케일 금지). `prefers-reduced-motion`을 반드시 지원.
