import openai
from .config import OPENAI_API_KEY, GPT_MODEL

_client = openai.OpenAI(api_key=OPENAI_API_KEY)


def urdu_to_roman(urdu_text: str) -> str:
    """Convert Urdu (Arabic script) to Roman Urdu."""
    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that converts Urdu (Arabic script) "
                    "into Roman-Urdu (Latin characters). Preserve meaning, punctuation and numbers."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Convert the following Urdu text into Roman Urdu "
                    "(use natural conversational transliteration).\n\n"
                    f"Text:\n{urdu_text}\n\nReturn ONLY the Roman-Urdu text."
                ),
            },
        ],
        temperature=0.0,
    )
    return resp.choices[0].message.content.strip()


def roman_to_urdu(roman_text: str) -> str:
    """Convert Roman Urdu to Urdu (Arabic script) for TTS."""
    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that converts Roman-Urdu (Latin characters) "
                    "into Urdu (Arabic script). Preserve meaning, punctuation and numbers."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Convert the following Roman-Urdu text into Urdu (Arabic script).\n\n"
                    f"Text:\n{roman_text}\n\nReturn ONLY the Urdu text."
                ),
            },
        ],
        temperature=0.0,
    )
    return resp.choices[0].message.content.strip()
