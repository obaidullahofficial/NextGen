#!/usr/bin/env python3
"""
Simple wrapper to call Google GenAI (Gemini) model.

- Reads GEMINI_API_KEY from the environment (or from a .env file if python-dotenv is installed).
- Exposes generate_content(prompt, model) that returns the model text.
- Runnable as a script for a quick test.

Usage (PowerShell):
  $env:GEMINI_API_KEY = "YOUR_KEY_HERE"
  python .\backend\ai\genai_client.py

Or add GEMINI_API_KEY=your_key to backend/.env and install python-dotenv to load it automatically.

"""

import os
from typing import Optional

# Try to load .env automatically if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()  # loads .env from current working directory
except Exception:
    # dotenv is optional; if not available we rely on environment variables
    pass

try:
    from google import genai
except Exception as e:
    raise ImportError("google-genai package is required. Install with `pip install google-genai`.") from e


def _get_api_key() -> Optional[str]:
    return os.getenv("GEMINI_API_KEY")


def create_client():
    """Create and return a genai.Client using GEMINI_API_KEY from environment.

    Raises RuntimeError if the key isn't set.
    """
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set. Set it in your shell or in backend/.env")

    # genai.Client will also try to read from env itself if not provided, but we pass it explicitly for clarity
    return genai.Client(api_key=api_key)


def generate_content(prompt: str, model: str = "gemini-2.5-flash") -> str:
    """Generate content from Gemini and return the resulting text.

    Args:
        prompt: text prompt to send to the model
        model: model name (default "gemini-2.5-flash")

    Returns:
        Generated text from the model.
    """
    client = create_client()

    # The minimal example from your snippet
    response = client.models.generate_content(model=model, contents=prompt)

    # The response object usually exposes `.text` in the simple example; fall back to str()
    return getattr(response, "text", str(response))


if __name__ == "__main__":
    prompt = "Explain how AI works in a few words"

    try:
        print("Using GEMINI_API_KEY from environment (or backend/.env if present)")
        out = generate_content(prompt)
        print("\n=== Model output ===\n")
        print(out)
    except Exception as e:
        print("Error calling Gemini API:\n", e)
        print("\nTips:")
        print(" - Make sure you set GEMINI_API_KEY in PowerShell: $env:GEMINI_API_KEY = \"YOUR_KEY\"")
        print(" - Or add GEMINI_API_KEY=your_key to backend/.env and install python-dotenv")
