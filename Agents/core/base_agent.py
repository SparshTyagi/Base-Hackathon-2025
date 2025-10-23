"""Base agent class for LLM interactions."""
import json
import time
from openai import OpenAI
from .settings import get_fast_model, get_fallback_models


class BaseAgent:
    """A base class for Agents that use an LLM, providing a shared client."""
    
    def __init__(self, model: str | None, api_key: str, site_url: str = None, site_name: str = None):
        # Request behavior tuning
        try:
            self.request_timeout_s: float | None = float((__import__('os').getenv("LLM_REQUEST_TIMEOUT_S", "45")).strip())
        except Exception:
            self.request_timeout_s = 45.0
        try:
            self.max_retries: int = int((__import__('os').getenv("LLM_MAX_RETRIES", "0")).strip())
        except Exception:
            self.max_retries = 0

        # Local retry policy (before falling back to other models)
        try:
            self.attempts_per_model: int = int((__import__('os').getenv("LLM_ATTEMPTS_PER_MODEL", "3")).strip())
        except Exception:
            self.attempts_per_model = 3
        try:
            delays_raw = (__import__('os').getenv("LLM_RETRY_DELAYS_S", "15,20")).strip()
            self.retry_delays_s: list[float] = [float(x.strip()) for x in delays_raw.split(",") if x.strip()]
        except Exception:
            self.retry_delays_s = [15.0, 20.0]

        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            timeout=self.request_timeout_s,
            max_retries=self.max_retries,
        )
        # If no model is provided, default to the centrally configured fast model
        self.model = model or get_fast_model()
        self.extra_headers = {}
        if site_url:
            self.extra_headers["HTTP-Referer"] = site_url
        if site_name:
            self.extra_headers["X-Title"] = site_name

    def _send_llm_request(self, messages: list[dict]) -> dict | None:
        """Sends a request to the LLM and returns a parsed JSON object."""
        response_content = None
        models_to_try: list[str] = [self.model] + [m for m in get_fallback_models() if m and m != self.model]
        last_error: Exception | None = None
        
        for idx, model_name in enumerate(models_to_try, start=1):
            if idx > 1:
                print(f"Retrying with fallback model {idx-1}: {model_name}")

            attempts = max(1, int(self.attempts_per_model or 1))
            for attempt in range(1, attempts + 1):
                try:
                    completion = self.client.chat.completions.create(
                        extra_headers=self.extra_headers,
                        model=model_name,
                        messages=messages,
                        response_format={"type": "json_object"},
                    )
                    response_content = completion.choices[0].message.content
                    if not response_content:
                        print("LLM returned empty content.")
                        raise ValueError("empty content")
                    return json.loads(response_content)
                except json.JSONDecodeError as e:
                    last_error = e
                    print(f"Error decoding LLM response from {model_name} (attempt {attempt}/{attempts}): {e}\nRaw response: {response_content}")
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    print(f"LLM request failed on {model_name} (attempt {attempt}/{attempts}): {err_str}")

                # If more attempts remain for this model, wait before retrying
                if attempt < attempts:
                    delay_idx = min(attempt - 1, max(0, len(self.retry_delays_s) - 1))
                    delay_s = float(self.retry_delays_s[delay_idx]) if self.retry_delays_s else 15.0
                    print(f"Waiting {delay_s:.0f}s before retrying model {model_name}...")
                    try:
                        time.sleep(delay_s)
                    except Exception:
                        pass
                else:
                    break
                    
        # Exhausted all models
        if last_error:
            print(f"All model attempts failed. Last error: {last_error}")
        return None

    def safe_llm_json(self, messages: list[dict], fallback: dict | list | None = None) -> dict | list | None:
        """Helper: never raise, always return JSON or fallback."""
        try:
            result = self._send_llm_request(messages)
            if result is None:
                return fallback if fallback is not None else {}
            return result
        except Exception as e:
            print(f"safe_llm_json error: {e}")
            return fallback if fallback is not None else {}
