# Multi-Modal AI

Text in, text out. That has been the dominant pattern for working with LLMs. But the most capable models today can see images, hear audio, and generate content across multiple modalities. This fundamentally expands what you can build — from applications that analyze photos and diagrams to systems that transcribe meetings and generate voice responses. Multi-modal AI is where the API-first approach meets the richness of the physical world.

## What Multi-Modal Means

:::definition[Multi-Modal AI]
AI systems that can process and generate content across multiple types of data — text, images, audio, video — rather than being limited to a single modality. A multi-modal model can look at a photograph and describe what it sees, or listen to audio and produce a transcript.
:::

The key insight is that modern foundation models are converging. Instead of separate models for text, vision, and audio, frontier models like Claude, GPT-4, and Gemini handle multiple modalities within a single architecture. This means you can send an image and a text prompt in the same API call and get a response that understands both.

## Vision: Teaching Your Applications to See

Vision capabilities let you send images to an LLM and ask questions about them. This is not image classification from five years ago — these models genuinely understand visual content at a semantic level.

```python
import anthropic
import base64
import httpx

client = anthropic.Anthropic()

# Option 1: Send an image from a URL
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "url",
                    "url": "https://example.com/chart.png"
                }
            },
            {
                "type": "text",
                "text": "Analyze this chart. What are the key trends and any anomalies?"
            }
        ]
    }]
)
print(message.content[0].text)
```

```python
# Option 2: Send a local image file as base64
def analyze_local_image(image_path, prompt):
    """Send a local image to Claude for analysis."""
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    # Determine media type from extension
    ext = image_path.rsplit(".", 1)[-1].lower()
    media_types = {"png": "image/png", "jpg": "image/jpeg",
                   "jpeg": "image/jpeg", "gif": "image/gif", "webp": "image/webp"}
    media_type = media_types.get(ext, "image/png")

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    )
    return message.content[0].text
```

### Practical Vision Use Cases

**Document extraction:** Photograph a receipt, invoice, or form and extract structured data:

```python
result = analyze_local_image(
    "receipt.jpg",
    """Extract all items from this receipt as JSON:
    {"store": "...", "items": [{"name": "...", "price": 0.00}], "total": 0.00}"""
)
```

**Diagram understanding:** Upload architecture diagrams, flowcharts, or wireframes:

```python
result = analyze_local_image(
    "system_architecture.png",
    "Describe this system architecture. What are the main components and how do they interact?"
)
```

**Code screenshot analysis:** When someone shares a screenshot of code instead of text:

```python
result = analyze_local_image(
    "code_screenshot.png",
    "Transcribe this code exactly and identify any bugs."
)
```

## Audio: Transcription and Understanding

Audio processing opens up meeting transcription, voice interfaces, and podcast analysis. While Claude and many LLMs focus on text and vision, the ecosystem provides powerful audio APIs.

**OpenAI Whisper for transcription:**

```python
from openai import OpenAI

client = OpenAI()

def transcribe_audio(audio_path):
    """Transcribe an audio file using Whisper."""
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )
    return transcript
```

**Combining audio transcription with text analysis:**

```python
def analyze_meeting(audio_path):
    """Transcribe a meeting and extract action items."""
    # Step 1: Transcribe
    transcript = transcribe_audio(audio_path)
    text = transcript.text

    # Step 2: Analyze with Claude
    anthropic_client = anthropic.Anthropic()
    analysis = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Analyze this meeting transcript and extract:
1. Key decisions made
2. Action items with owners
3. Open questions that need follow-up

Transcript:
{text}"""
        }]
    )
    return analysis.content[0].text
```

## Multi-Modal Prompting Techniques

Working with images and audio requires different prompting strategies than pure text:

### Be Specific About What to Look At

```python
# Vague — model does not know what you care about
"What do you see in this image?"

# Specific — focused analysis
"Look at the bar chart in this image. Which category has the highest
value, and is there a statistically significant difference between
the top two categories?"
```

### Provide Context the Model Cannot See

```python
# The model sees pixels but not context
"This is a screenshot of our production dashboard from Monday morning.
The normal range for response time is 100-200ms. Are there any
anomalies in this chart?"
```

### Chain Visual and Text Analysis

```python
# First message: analyze the image
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "url", "url": chart_url}},
            {"type": "text", "text": "Describe the data trends in this chart."}
        ]
    }
]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=messages
)

# Second message: build on the analysis
messages.append({"role": "assistant", "content": response.content[0].text})
messages.append({
    "role": "user",
    "content": "Based on these trends, what would you predict for next quarter? What assumptions are you making?"
})

followup = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=messages
)
```

## Building a Multi-Modal Analysis Pipeline

Here is a practical pattern that combines vision and text for automated report analysis:

```python
import os
import json


class MultiModalAnalyzer:
    def __init__(self):
        self.client = anthropic.Anthropic()

    def analyze_document(self, image_paths, analysis_prompt):
        """Analyze one or more document images together."""
        content = []

        for path in image_paths:
            with open(path, "rb") as f:
                image_data = base64.standard_b64encode(f.read()).decode("utf-8")

            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_data
                }
            })

        content.append({"type": "text", "text": analysis_prompt})

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": content}]
        )
        return response.content[0].text

    def compare_charts(self, chart_path_a, chart_path_b):
        """Compare two charts and identify differences."""
        return self.analyze_document(
            [chart_path_a, chart_path_b],
            "Compare these two charts. What changed between them? "
            "Highlight the most significant differences."
        )

    def extract_table_data(self, image_path):
        """Extract tabular data from an image as structured JSON."""
        return self.analyze_document(
            [image_path],
            "Extract all data from this table as JSON. "
            "Use the column headers as keys."
        )
```

## Limitations and Considerations

Multi-modal AI is powerful but has important constraints:

**Image understanding is not perfect.** Models can misread text in images, miscount objects, or misinterpret diagrams. Always verify extracted data against the source.

**Token costs increase with images.** A single image can consume thousands of tokens. Be mindful of costs when processing many images.

**Audio quality matters.** Transcription accuracy drops significantly with background noise, overlapping speakers, or heavy accents. Preprocessing audio (noise reduction, normalization) improves results.

**Not all models support all modalities.** Check the documentation for which models support which input types. Capabilities are expanding rapidly — what is unavailable today may work next month.

:::callout[tip]
Start with the simplest approach that could work. If you need to extract text from a clean document, OCR might be faster and cheaper than sending it to an LLM. Use multi-modal AI when you need understanding, not just extraction.
:::

## What You've Learned

You can now build applications that work beyond text:

- **Vision APIs** let you send images alongside text prompts for visual understanding
- **Audio transcription** converts speech to text for downstream analysis
- **Multi-modal prompting** requires specific, contextual instructions
- **Practical pipelines** combine image analysis, transcription, and text reasoning
- **Limitations** include accuracy constraints, token costs, and model-specific support

The ability to process images, audio, and text in a single workflow opens up application categories that were impossible just two years ago. From automated document processing to meeting summarization to visual quality assurance, multi-modal AI is one of the fastest-growing areas in applied AI engineering.
