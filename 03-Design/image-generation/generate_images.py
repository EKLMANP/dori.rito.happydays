#!/usr/bin/env python3
"""
Dori & Rito - Image Generation & Upload Pipeline
Uses Google Gemini Imagen 3 API to generate images,
uploads to ImgBB, returns URLs.
"""
import requests
import json
import base64
import sys
import time
import os

GOOGLE_API_KEY = os.environ.get("GOOGLE_AI_STUDIO_API_KEY", "AIzaSyCOK86o99vA1MQQe4RgGkaL2GLUH4LZXz4")
IMGBB_API_KEY = os.environ.get("IMGBB_API_KEY", "96048280db73aff42bcd80f12356c3f3")


def generate_image_imagen(prompt, aspect_ratio="16:9"):
    """Generate image using Imagen 4 via Gemini API"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={GOOGLE_API_KEY}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_ratio,
            "personGeneration": "allow_adult"
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=120)
        if response.status_code != 200:
            print(f"  [ERROR] Imagen API: {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return None

        data = response.json()
        if "predictions" in data and len(data["predictions"]) > 0:
            return data["predictions"][0]["bytesBase64Encoded"]
        else:
            print(f"  [ERROR] No predictions in response")
            return None
    except Exception as e:
        print(f"  [ERROR] Exception: {e}")
        return None


def generate_image_gemini_flash(prompt):
    """Generate image using Gemini 2.0 Flash image generation (fallback)"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": f"Generate a photorealistic image: {prompt}"}]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=120)
        if response.status_code != 200:
            print(f"  [ERROR] Gemini Flash API: {response.status_code}")
            return None

        data = response.json()
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    return part["inlineData"]["data"]
        return None
    except Exception as e:
        print(f"  [ERROR] Exception: {e}")
        return None


def upload_to_imgbb(base64_image, name="image"):
    """Upload base64 image to ImgBB"""
    url = "https://api.imgbb.com/1/upload"
    payload = {
        "key": IMGBB_API_KEY,
        "image": base64_image,
        "name": name
    }

    try:
        response = requests.post(url, data=payload, timeout=60)
        if response.status_code != 200:
            print(f"  [ERROR] ImgBB upload: {response.status_code}")
            return None

        data = response.json()
        if data.get("success"):
            img_url = data["data"]["url"]
            print(f"  [OK] Uploaded: {img_url}")
            return img_url
        else:
            print(f"  [ERROR] ImgBB response: {data}")
            return None
    except Exception as e:
        print(f"  [ERROR] Upload exception: {e}")
        return None


def generate_and_upload(prompt, name="image", aspect_ratio="16:9"):
    """Generate image and upload to ImgBB, return URL"""
    print(f"\n  Generating: {name}...")

    # Try Imagen 3 first
    b64_image = generate_image_imagen(prompt, aspect_ratio)

    # Fallback to Gemini Flash
    if not b64_image:
        print("  Trying Gemini Flash fallback...")
        b64_image = generate_image_gemini_flash(prompt)

    if not b64_image:
        print(f"  [FAILED] Could not generate image for: {name}")
        return None

    print(f"  Image generated, uploading to ImgBB...")
    url = upload_to_imgbb(b64_image, name)

    # Rate limit protection
    time.sleep(2)

    return url


if __name__ == "__main__":
    # Test with a simple prompt
    test_prompt = "A friendly golden retriever sitting calmly in a modern Taiwanese apartment living room, warm natural lighting, photorealistic, 1080x540"
    result = generate_and_upload(test_prompt, "test-image")
    if result:
        print(f"\n SUCCESS! Test image URL: {result}")
    else:
        print("\n FAILED - check API keys and connectivity")
