"""Gemini API agent — uses Gemini REST API directly instead of CLI."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Callable, Optional

import httpx


class ApiGeminiAgent:
    """Controls Gemini via REST API for environments without CLI."""

    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    def __init__(self, work_dir: str, on_log: Callable, api_key: str, on_question: Optional[Callable] = None):
        self.work_dir = work_dir
        self.on_log = on_log
        self.on_question = on_question
        self.api_key = api_key
        self.is_running = False
        self._user_response: Optional[asyncio.Future] = None
        self._conversation_log: list[str] = []

    async def send_user_response(self, message: str):
        if self._user_response and not self._user_response.done():
            self._user_response.set_result(message)

    async def run_prompt(self, prompt: str, save_to: Optional[str] = None, _internal: bool = False) -> str:
        if not _internal:
            self.is_running = True
        await self.on_log("SYS", "Gemini API 호출 중...")

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(
                    f"{self.API_URL}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
                    },
                )

                if resp.status_code != 200:
                    await self.on_log("ERR", f"Gemini API 오류: {resp.status_code} {resp.text[:200]}")
                    return ""

                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]

                # Stream line by line
                for line in text.strip().split("\n"):
                    if line.strip():
                        await self.on_log("GEM", line.strip())

                if save_to and text:
                    save_path = os.path.join(self.work_dir, save_to)
                    os.makedirs(os.path.dirname(save_path), exist_ok=True)
                    with open(save_path, "w", encoding="utf-8") as f:
                        f.write(text)
                    size_kb = len(text.encode("utf-8")) / 1024
                    await self.on_log("SYS", f"{save_to} 저장됨 ({size_kb:.1f}KB)")

                return text

        except Exception as e:
            await self.on_log("ERR", f"Gemini API 오류: {str(e)}")
            return ""
        finally:
            if not _internal:
                self.is_running = False

    async def run_envisioning_interactive(self, user_idea: str, num_questions: int = 4) -> str:
        self.is_running = True
        self._conversation_log = []

        await self.on_log("SYS", "Gemini API 기획 인터뷰 시작")
        await self.on_log("GEM", f"앱 아이디어를 분석합니다: \"{user_idea}\"")

        question_prompt = f"""당신은 시니어 프로덕트 매니저 겸 UX 디자이너입니다.
사용자가 "{user_idea}" 앱을 만들고 싶어합니다.

이 앱의 요구사항을 정확히 파악하기 위해 사용자에게 물어볼 핵심 질문 {num_questions}개를 만들어주세요.

중요: 반드시 아래 두 가지 질문을 포함해야 합니다:
- 프레임워크/플랫폼 선택 질문: "어떤 플랫폼으로 만들까요? (1) React/Next.js 웹앱 (2) Flutter 기반 PWA (3) React Native 모바일앱"
- 디자인 스타일 선택 질문: "어떤 디자인 스타일을 원하시나요? (1) Minimal (2) Glassmorphism (3) Neumorphism (4) Brutalist (5) Material Design (6) 다크 모드 중심"

각 질문은 한 줄로, 번호를 붙여서 출력하세요. 질문만 출력하고 다른 설명은 하지 마세요."""

        questions_raw = await self.run_prompt(question_prompt, _internal=True)
        if not questions_raw.strip():
            await self.on_log("ERR", "질문 생성 실패")
            self.is_running = False
            return ""

        questions = []
        for line in questions_raw.strip().split("\n"):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith("-")):
                questions.append(line)
        if not questions:
            questions = [questions_raw.strip()]

        self._conversation_log.append(f"앱 아이디어: {user_idea}")

        for i, question in enumerate(questions):
            await self.on_log("GEM", f"Q{i+1}: {question.lstrip('0123456789.-) ').strip()}")

            if self.on_question:
                await self.on_question()

            loop = asyncio.get_running_loop()
            self._user_response = loop.create_future()
            try:
                answer = await asyncio.wait_for(self._user_response, timeout=300)
            except asyncio.TimeoutError:
                answer = "적절히 결정해주세요"

            await self.on_log("USR", answer)
            self._conversation_log.append(f"Q: {question}")
            self._conversation_log.append(f"A: {answer}")

        await self.on_log("GEM", "인터뷰 완료. 기획서를 작성합니다...")

        conversation = "\n".join(self._conversation_log)
        spec_prompt = f"""당신은 시니어 프로덕트 매니저 겸 테크 리드입니다.
아래는 사용자와의 인터뷰 내용입니다:

{conversation}

이 인터뷰 내용을 바탕으로 완전한 기획서를 작성해주세요.

## 프로젝트명: [이름]
## 핵심 목적: [한 줄 설명]
## 타겟 사용자: [설명]
## MVP 기능:
1. [기능1]: [설명]
## 기술 스택:
- Frontend: [...]
- Backend: [...]
- Database: [...]
## 데이터 모델:
[엔티티명] - [필드 목록] - [관계]
## 화면 흐름:
Flow 1: [단계1] → [단계2] → [단계3]
## 비기능 요구사항:
- [항목1]"""

        spec = await self.run_prompt(spec_prompt, save_to="docs/01-planning/spec.md", _internal=True)
        self.is_running = False
        return spec

    async def run_blueprinting(self, spec_content: str) -> str:
        prompt = f"""아래는 확정된 앱 기획서입니다:

{spec_content}

이 기획서를 바탕으로 'CLAUDE.md' 파일을 작성해 주세요.
Claude Code CLI가 이 파일을 읽고 자율적으로 코딩할 수 있어야 합니다.

CLAUDE.md에 반드시 포함할 내용:
### 1. 프로젝트 개요
### 2. 기술 스택 (버전 포함)
### 3. 프로젝트 구조 (File Tree)
### 4. 데이터 모델 상세
### 5. 구현 우선순위 (Task Checklist)
### 6. 코딩 컨벤션
### 7. 디자인 가이드라인 (컬러 팔레트 hex, 타이포그래피, 애니메이션)
### 8. 테스트 요구사항
### 9. 금지 사항"""

        return await self.run_prompt(prompt, save_to="CLAUDE.md")

    async def run_review(self, code_summary: str) -> str:
        prompt = f"""아래는 구현된 코드의 요약입니다:

{code_summary}

코드 리뷰를 수행하고 아래 형식으로 출력해 주세요:

## 코드 리뷰 리포트
### 🔴 Critical (즉시 수정 필요)
### 🟡 Warning (권장 수정)
### 🟢 Suggestion (개선 아이디어)
### 📊 종합 점수: [1~10] / 10"""

        return await self.run_prompt(prompt, save_to="docs/04-reviews/review.md")

    async def stop(self):
        self.is_running = False
        if self._user_response and not self._user_response.done():
            self._user_response.cancel()
