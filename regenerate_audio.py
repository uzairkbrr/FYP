import os
import json
from gtts import gTTS
import openai
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

def roman_to_arabic(roman_text, model='gpt-4o-mini', temperature=0.0):
    sys_msg = 'You are a helpful assistant that converts Roman-Urdu (Latin characters) into Urdu (Arabic script). Preserve meaning, punctuation and numbers.'
    prompt = f'Convert the following Roman-Urdu text into Urdu (Arabic script).\n\nText:\n{roman_text}\n\nReturn ONLY the Urdu text.'
    
    resp = openai.chat.completions.create(
        model=model,
        messages=[{'role': 'system', 'content': sys_msg}, {'role': 'user', 'content': prompt}],
        temperature=temperature,
    )
    return resp.choices[0].message.content.strip()

# Load the updated summary.json
with open('test_results/summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

output_dir = 'test_results'

for entry in data:
    roman_response = entry['response_roman']
    arabic_response = roman_to_arabic(roman_response)
    
    out_filename = f"response_{os.path.basename(entry['input_audio']).replace('.ogg', '.mp3')}"
    out_path = os.path.join(output_dir, out_filename)
    
    if arabic_response:
        t = gTTS(text=arabic_response, lang='ur')
        t.save(out_path)
        print(f"Generated: {out_filename}")
    else:
        print(f"Failed to convert: {entry['input_audio']}")

print("Voice note regeneration complete.")