# How AI APIs Work

Your program sends a request to a model provider and receives a response. Your job is to handle both a useful answer and a failed request.

Start without an account or payment. The example below uses a simulated response unless you explicitly choose a live API call.

## What to Send—and What to Check

A request identifies the model, includes the task and sets an output limit. The response may contain text, other content blocks, usage information or an error.

Check these separately:

- Did the request succeed?
- Did generation finish, or hit its limit?
- Does the answer meet your requirements?

A successful HTTP response does not mean the answer is correct. A lower temperature is not a factual-accuracy setting; parameter support also varies by model.

Conversation state depends on the endpoint. With the Claude Messages API, your application supplies the relevant message history. Other APIs offer stored conversation or response identifiers. Read the documentation for the endpoint you use.

## Run a Safe First Example

Save this as `api_example.py`. Its default mode uses only Python's standard library.

```python
import argparse
import os


def ask(question, live=False):
    if not question.strip():
        raise ValueError("Write a question first.")
    if not live:
        return {
            "text": "SIMULATED: An API lets one program request work from another.",
            "complete": True,
            "usage": None,
        }

    # Optional dependencies are needed only for --live.
    import anthropic
    from dotenv import load_dotenv

    load_dotenv()
    if not os.getenv("ANTHROPIC_API_KEY") or not os.getenv("ANTHROPIC_MODEL"):
        raise ValueError("Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL locally.")

    client = anthropic.Anthropic(timeout=15.0, max_retries=0)
    message = client.messages.create(
        model=os.environ["ANTHROPIC_MODEL"],
        max_tokens=128,
        messages=[{"role": "user", "content": question}],
    )
    text = "\n".join(
        block.text for block in message.content if block.type == "text"
    )
    return {
        "text": text,
        "complete": message.stop_reason == "end_turn",
        "usage": {
            "input_tokens": message.usage.input_tokens,
            "output_tokens": message.usage.output_tokens,
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("question", nargs="?", default="Explain an API in one sentence.")
    parser.add_argument("--live", action="store_true",
                        help="Send one metered request to the model provider.")
    args = parser.parse_args()
    try:
        result = ask(args.question, live=args.live)
        print(result["text"] or "No text was returned.")
        print("Generation finished:", result["complete"])
        print("Usage:", result["usage"])
    except Exception as error:
        # Do not print credentials, request bodies or sensitive server errors.
        print(f"Request failed ({type(error).__name__}). Check setup and try again.")
        raise SystemExit(1)
```

Run `python api_example.py`. Expect a response beginning with **SIMULATED** and usage of `None`. This tests the program's shape, not a model.

Try `python api_example.py ""`. It should exit with a visible error.

## Optional: Make One Live Call

API access can require separate billing from a chat subscription. Do not assume free credits or a fixed cost.

1. In a virtual environment, run `python -m pip install anthropic python-dotenv`.
2. Add `.env` to `.gitignore` **before** creating it. Keep real keys out of source code, browser code, screenshots and shared prompts.
3. In that local file, set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`. Choose an available model ID from your provider account. Check its current price and configure spending controls.
4. Run `python api_example.py --live` once. Inspect usage and the completion flag.

This example does not retry automatically. Authentication errors need a credentials check; unavailable models need a model check; rate limits need a pause. Do not respond to every failure with an unlimited retry loop.

## Keep the Result Honest

Text generation can stop early, return no text or give a plausible but wrong answer. Add a test based on the actual task—for example, whether a returned category is in your allowed set. Use synthetic or public data while learning.

Token counts are not word counts, and cost depends on the model, input, output and enabled features. Use the returned usage and the provider's current pricing, not a price table copied into a lesson.

## References

- [Claude Python Messages API](https://platform.claude.com/docs/en/api/python/messages/create): current request fields, response blocks and stop reasons.
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python): installation, timeouts, errors and retry configuration.
- [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing): check before enabling live calls.
