from TTS.api import TTS
import os

# Initialize TTS with a multi-speaker model
tts = TTS(model_name="tts_models/en/vctk/vits")

# Create test directory
os.makedirs("test_samples", exist_ok=True)

# List of test sentences
sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Hello, how are you doing today?",
    "I love to read books and learn new things.",
    "The weather is beautiful outside.",
    "Music brings joy to people's lives.",
    "Technology is advancing at a rapid pace.",
    "Learning a new language is challenging but rewarding.",
    "Exercise is important for maintaining good health.",
    "The sunset painted the sky in beautiful colors.",
    "Fresh fruits and vegetables are essential for a healthy diet.",
    "Time management is key to productivity.",
    "The ocean waves crash against the shore.",
    "Birds sing their morning songs.",
    "Laughter is the best medicine.",
    "Knowledge is power.",
    "Practice makes perfect.",
    "Every cloud has a silver lining.",
    "Actions speak louder than words.",
    "Life is like a box of chocolates.",
    "Where there's a will, there's a way."
]

print("Available speakers:", tts.speakers)
speaker = tts.speakers[0]  # Using the first available speaker
print(f"Using speaker: {speaker}")

for i, text in enumerate(sentences, 1):
    output_path = f"test_samples/sample_{i:02d}.wav"
    tts.tts_to_file(
        text=text,
        speaker=speaker,
        file_path=output_path
    )
    print(f"Generated {output_path}")
