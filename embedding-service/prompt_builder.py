"""
prompt_builder.py — builds the LLM prompt for the RAG chatbot.

Constraints (from design):
- Context window: max 3000 tokens (approximated by whitespace-split word count)
- Chat history: last 3 pairs (6 messages) only
"""

from typing import List, Dict

MAX_CONTEXT_TOKENS = 3000
MAX_HISTORY_PAIRS = 3

SYSTEM_PROMPT_AR = """أنت مساعد ذكي لمنصة Voices of Syria. مهمتك الإجابة على أسئلة المستخدمين بناءً فقط على محتوى القصص المقدمة.

قواعد مهمة:
- أجب بنفس لغة السؤال (عربي أو إنجليزي)
- استند فقط على المعلومات الموجودة في القصص أدناه
- إذا لم تجد إجابة كافية، قل ذلك بوضوح
- لا تخترع معلومات غير موجودة في القصص"""

SYSTEM_PROMPT_EN = """You are an intelligent assistant for the Voices of Syria platform. Your task is to answer user questions based solely on the provided stories.

Important rules:
- Answer in the same language as the question (Arabic or English)
- Base your answer only on the information in the stories below
- If you cannot find a sufficient answer, say so clearly
- Do not invent information not present in the stories"""


def _count_tokens(text: str) -> int:
    """Approximate token count using whitespace split."""
    return len(text.split())


def _build_context(stories: List[Dict]) -> str:
    """
    Concatenate story content up to MAX_CONTEXT_TOKENS.
    Each story dict must have at least 'content' and optionally 'title'.
    """
    parts = []
    total_tokens = 0

    for story in stories:
        title = story.get("title", "")
        content = story.get("content", "")
        story_text = f"[{title}]\n{content}" if title else content
        story_tokens = _count_tokens(story_text)

        if total_tokens + story_tokens > MAX_CONTEXT_TOKENS:
            # Truncate this story to fit remaining budget
            remaining = MAX_CONTEXT_TOKENS - total_tokens
            words = story_text.split()
            story_text = " ".join(words[:remaining])
            parts.append(story_text)
            break

        parts.append(story_text)
        total_tokens += story_tokens

    return "\n---\n".join(parts)


def _build_history_block(chat_history: List[Dict]) -> str:
    """
    Return the last MAX_HISTORY_PAIRS pairs (user+assistant) as a formatted string.
    Each entry in chat_history: {"role": "user"|"assistant", "content": "..."}
    """
    if not chat_history:
        return ""

    # Pair up messages: collect complete user/assistant pairs from the end
    pairs = []
    i = 0
    while i < len(chat_history) - 1:
        if chat_history[i]["role"] == "user" and chat_history[i + 1]["role"] == "assistant":
            pairs.append((chat_history[i], chat_history[i + 1]))
            i += 2
        else:
            i += 1

    # Keep only the last MAX_HISTORY_PAIRS pairs
    pairs = pairs[-MAX_HISTORY_PAIRS:]

    if not pairs:
        return ""

    lines = []
    for user_msg, assistant_msg in pairs:
        lines.append(f"المستخدم: {user_msg['content']}")
        lines.append(f"المساعد: {assistant_msg['content']}")

    return "\n".join(lines)


def build_prompt(
    question: str,
    stories: List[Dict],
    chat_history: List[Dict],
    language: str = "ar",
) -> str:
    """
    Build the full prompt string to send to the LLM.

    Args:
        question: The user's question.
        stories: List of story dicts with 'title', 'content', 'relevance_score'.
        chat_history: List of {"role": ..., "content": ...} dicts.
        language: "ar" or "en".

    Returns:
        A formatted prompt string.
    """
    system_prompt = SYSTEM_PROMPT_AR if language == "ar" else SYSTEM_PROMPT_EN
    context = _build_context(stories)
    history_block = _build_history_block(chat_history)

    question_label = "السؤال" if language == "ar" else "Question"
    answer_label = "الجواب" if language == "ar" else "Answer"
    stories_label = "القصص ذات الصلة" if language == "ar" else "Relevant Stories"

    parts = [system_prompt, "", f"{stories_label}:", "---", context, "---", ""]

    if history_block:
        parts += [history_block, ""]

    parts += [f"{question_label}: {question}", f"{answer_label}:"]

    return "\n".join(parts)
