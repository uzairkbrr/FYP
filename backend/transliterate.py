import openai
from .settings import _k1, model_text, _s4

_client = openai.OpenAI(api_key=_k1)


# We're working with roman-urdu data, and every STT model returns Urdu script not roman-urdu. But we need roman-urdu to query to knowledge base;
# Therefore, there's no light weight model available for the conversion task; The best option was to use a good model to do this job;
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
