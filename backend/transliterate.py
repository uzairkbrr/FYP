import openai
from .settings import _k1, model_text, _s4

_client = openai.OpenAI(api_key=_k1)


def urdu_to_roman(urdu_text: str) -> str:
    """Convert Urdu (Arabic script) to Roman Urdu."""
    resp = _client.chat.completions.create(
        model=model_text,
        messages=[
            {"role": "system", "content": _s4},
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
