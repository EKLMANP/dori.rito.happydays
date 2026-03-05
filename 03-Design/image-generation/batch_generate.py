#!/usr/bin/env python3
"""
Batch image generation for Dori & Rito blog/newsletter articles.
Generates all images, uploads to ImgBB, outputs JSON with URLs.
"""
import json
import time
import sys
sys.path.insert(0, '.')
from generate_images import generate_and_upload

# ============================================================
# ALL IMAGE TASKS
# ============================================================

TASKS = {
    # ========================================
    # 1. 吠叫系列 10【部落格】
    # ========================================
    "blog10_banner": {
        "page_id": "96577649119b4a898a4ce27d7ceaeb5f",
        "section": "banner",
        "prompt": "A realistic photo of a small mixed-breed dog wearing a bark collar looking subdued and sad in a Taiwanese apartment living room, the dog's posture is hunched with ears back showing distress, warm natural light from window, modern Taiwanese home interior, emotional and empathetic mood, eye-level shot, NOT cartoon, NOT illustration"
    },
    "blog10_img1": {
        "page_id": "96577649119b4a898a4ce27d7ceaeb5f",
        "section": "迷思 × 真相",
        "prompt": "A realistic photo showing five common anti-barking tools arranged on a wooden table in a Taiwanese home - a spray bottle, an ultrasonic bark deterrent device, a crate with the door open, with red X marks overlaid, warm natural lighting, clean composition, informational and myth-busting feel, NOT cartoon, NOT illustration"
    },
    "blog10_img2": {
        "page_id": "96577649119b4a898a4ce27d7ceaeb5f",
        "section": "正向訓練",
        "prompt": "A realistic photo of a Taiwanese woman kneeling at eye level with a calm golden retriever mix in a bright living room, she is offering a small treat while the dog sits quietly with relaxed body language, positive training moment, natural sunlight streaming in, warm and hopeful atmosphere, NOT cartoon, NOT illustration, NOT studio lighting"
    },
    "blog10_img3": {
        "page_id": "96577649119b4a898a4ce27d7ceaeb5f",
        "section": "KPA",
        "prompt": "A realistic photo of a professional female dog trainer in casual clothes gently interacting with a nervous rescue dog in a cozy Taiwanese apartment, the dog is starting to relax and approach the trainer, showing trust being built, soft warm lighting, compassionate and professional atmosphere, NOT cartoon, NOT illustration"
    },
    "blog10_img4": {
        "page_id": "96577649119b4a898a4ce27d7ceaeb5f",
        "section": "FAQ",
        "prompt": "A realistic photo of a person sitting on a couch in a Taiwanese apartment with a laptop open, a medium mixed-breed dog lying peacefully beside them on the couch, cozy evening scene with warm lamp lighting, the person looks relieved and content, showing the peaceful result of proper training, NOT cartoon, NOT illustration"
    },

    # ========================================
    # 2. 吠叫系列 2【部落格】
    # ========================================
    "blog02_banner": {
        "page_id": "482165098d844b4b96577782cbd7078b",
        "section": "banner",
        "prompt": "realistic photo, medium mixed breed dog lying calmly on a mat near apartment door, Taiwanese apartment living room, owner opening door to receive package, natural sunlight from window, warm and peaceful atmosphere, real dog, NOT cartoon, NOT illustration, 1080x540"
    },
    "blog02_img1": {
        "page_id": "482165098d844b4b96577782cbd7078b",
        "section": "為什麼門鈴",
        "prompt": "realistic photo, alert dog with ears perked up looking toward apartment door, Taiwanese apartment entrance hallway, natural expression of alertness, warm indoor lighting, real dog, NOT cartoon, NOT illustration, 1080x540"
    },
    "blog02_img2": {
        "page_id": "482165098d844b4b96577782cbd7078b",
        "section": "3步驟",
        "prompt": "realistic photo, dog owner sitting on living room floor holding smartphone and treats, dog sitting in front looking at owner attentively, Taiwanese apartment setting, training session, warm natural light, real dog, NOT cartoon, NOT illustration, 1080x540"
    },
    "blog02_img3": {
        "page_id": "482165098d844b4b96577782cbd7078b",
        "section": "環境管理",
        "prompt": "realistic photo, apartment door exterior with small handwritten note posted, delivery package on doorstep, through slightly open door a dog can be seen resting on mat in background, Taiwanese apartment building hallway, natural lighting, NOT cartoon, NOT illustration, 1080x540"
    },
    "blog02_img4": {
        "page_id": "482165098d844b4b96577782cbd7078b",
        "section": "結尾",
        "prompt": "realistic photo, smiling owner greeting friend at apartment door, dog lying calmly on mat in background with relaxed body language, warm and happy atmosphere, Taiwanese apartment, natural sunlight, real dog, NOT cartoon, NOT illustration, 1080x540"
    },

    # ========================================
    # 3. 吠叫系列 4【部落格】
    # ========================================
    "blog04_banner": {
        "page_id": "42e290903b604e83b8c5733360529cde",
        "section": "banner",
        "prompt": "Photorealistic horizontal image. A medium-sized mixed breed dog with tan brown coat standing in a typical Taiwan apartment entryway, facing a closed front door. The dog head is slightly lowered, ears gently pinned back, with a quiet longing expression, NOT barking or aggressive. A pair of house slippers is knocked slightly aside near the door. Warm but slightly muted indoor lighting. The apartment has typical Taiwan features: tiled floor near the entrance, shoe cabinet to the side. The mood is quiet melancholy, not dramatic. Canon 35mm f/2 look, warm undertones. No open mouth, no barking posture."
    },
    "blog04_img1": {
        "page_id": "42e290903b604e83b8c5733360529cde",
        "section": "焦慮vs無聊",
        "prompt": "Split-screen horizontal composition, photorealistic. LEFT HALF: warm reddish tint, a small white dog pacing anxiously near an apartment front door, slight scratch marks visible on the door surface, tense body posture, ears back. RIGHT HALF: cool blue-grey tint, a similar small dog lying lazily on a couch, surrounded by a chewed-up slipper and scattered toilet paper, relaxed but bored body language. Clean white dividing line in the center. Both scenes set in typical Taiwan apartment interiors. Natural indoor lighting. Professional dog training brand aesthetic."
    },
    "blog04_img2": {
        "page_id": "42e290903b604e83b8c5733360529cde",
        "section": "6週訓練",
        "prompt": "Clean modern infographic illustration, flat design style. Warm off-white background. A horizontal 3-phase timeline with brand orange accent color. Phase 1 Week 1-2: icon of a cozy dog crate with blanket, labeled Safe Base. Phase 2 Week 3-4: icon of a door with a small clock showing 30 seconds, labeled Short Leave. Phase 3 Week 5-6: icon of keys and a jacket, labeled Real Simulation. Connected by a gentle curved line with progress dots. Rounded corners, generous whitespace. Professional, warm, trustworthy. Google Material Design inspired but warmer palette."
    },
    "blog04_img3": {
        "page_id": "42e290903b604e83b8c5733360529cde",
        "section": "Kong",
        "prompt": "Photorealistic lifestyle photography. A Shiba Inu lying on a soft mat in a Taiwan apartment living room, intensely focused on licking a red Kong toy stuffed with frozen treats. Nearby: an open dog crate with a cozy blanket inside, door wide open not locked. No human in the frame implying the dog is home alone but happily occupied. Warm natural light from a window with sheer curtains. The dog appears calm and absorbed, not anxious. Shallow depth of field focusing on the dog and Kong. Warm film color grade. No barking, no stress signals."
    },

    # ========================================
    # 4. 吠叫系列 6【部落格】
    # ========================================
    "blog06_banner": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "banner",
        "prompt": "A realistic photo of a medium-sized mixed-breed dog barking at the front door of a Taiwanese apartment, standing alert with ears forward, while the owner stands behind looking apologetic with one hand on the dog collar, warm natural light from the hallway, typical Taiwanese apartment entrance with shoe rack visible, warm tone, eye-level angle, NOT cartoon, NOT illustration, NOT studio lighting"
    },
    "blog06_img1": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "4大原因",
        "prompt": "A realistic photo of a cautious mixed-breed dog peeking from behind its owner legs at a park in Taiwan, body language showing uncertainty slightly crouched ears back tail low, while a friendly stranger stands at a distance with hands at their sides, green park setting with typical Taiwanese urban background, natural daylight, warm empathetic tone, NOT cartoon, NOT illustration"
    },
    "blog06_img2": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "居家訓練",
        "prompt": "A realistic photo of a dog happily licking a Kong toy on a comfortable dog bed in a cozy corner of a Taiwanese apartment, with a baby gate visible in the background, soft blanket underneath, calm and safe atmosphere, warm indoor lighting from a nearby window, peaceful scene showing a dog safe space, NOT cartoon, NOT illustration, NOT studio"
    },
    "blog06_img3": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "戶外訓練",
        "prompt": "A realistic photo of a Taiwanese woman walking her leashed dog on a sidewalk, maintaining distance from a pedestrian walking ahead, the dog is looking at the distant person calmly while the owner has a treat bag at her waist, typical Taiwanese residential street with scooters parked and trees, morning natural light, warm encouraging tone, NOT cartoon, NOT illustration"
    },
    "blog06_img4": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "社會化窗口期",
        "prompt": "A realistic photo of an adult mixed-breed dog sitting calmly on grass in a quiet Taiwanese park, looking relaxed with soft eyes and a slightly open mouth, owner sitting beside on a park bench, a few people visible in the far background, golden hour warm sunlight, showing a confident and peaceful older dog, NOT cartoon, NOT illustration, NOT studio"
    },
    "blog06_img5": {
        "page_id": "58ac7771dfb6420eb8df5192fb3842ef",
        "section": "FAQ",
        "prompt": "A realistic photo of a person gently tossing a small treat on the ground near a curious but slightly hesitant dog in a Taiwanese living room, a guest sitting calmly on a couch in the background not looking at the dog, warm afternoon light from balcony, showing the treat-tossing technique for stranger desensitization, NOT cartoon, NOT illustration"
    },

    # ========================================
    # 5. 吠叫系列 8【部落格】
    # ========================================
    "blog08_banner": {
        "page_id": "6530c424b9454d3e8dafb725f3573196",
        "section": "banner",
        "prompt": "A split-screen horizontal composition, photorealistic style. LEFT HALF: warm orange gradient, a happy golden retriever running joyfully in a sunlit Taiwan community park, golden hour lighting. RIGHT HALF: soft blue gradient, same golden retriever lying calmly on warm hardwood floor, nose pressing a red Kong treat toy, focused expression. Warm professional dog training brand aesthetic. No barking dogs, no aggressive mouths. Ultra-realistic photography."
    },
    "blog08_img1": {
        "page_id": "6530c424b9454d3e8dafb725f3573196",
        "section": "身體vs心理",
        "prompt": "Photorealistic lifestyle photo. A tired but restless Shiba Inu lying on a modern Taiwan apartment sofa, panting slightly after exercise, but eyes alert and scanning the room with unfulfilled energy. Natural window light, warm afternoon tone. The dog looks physically tired but mentally restless. Taiwan apartment living room setting with minimal modern furniture."
    },
    "blog08_img2": {
        "page_id": "6530c424b9454d3e8dafb725f3573196",
        "section": "嗅覺搜索",
        "prompt": "Photorealistic lifestyle photography. A Beagle indoors in a Taiwan apartment, nose nearly touching warm oak hardwood floor, whole body weight shifted forward in intense concentration. Scattered around: small folded towels or upturned cups for DIY nose-work game. Natural side-window light creating warm golden streaks. Shallow depth of field. The dog appears completely absorbed, calm focus. Warm film color grade."
    },
    "blog08_img3": {
        "page_id": "6530c424b9454d3e8dafb725f3573196",
        "section": "嗅聞散步",
        "prompt": "Photorealistic lifestyle photography. A Pembroke Welsh Corgi outdoors on a Taiwan community park path, head lowered to sniff roadside grass intently, short legs spread slightly. The leash is clearly visible but completely slack, hanging in a gentle J-curve with zero tension. Golden hour lighting. The slack leash between dog and owner is the key detail. No tension, no pulling, no anxiety."
    },

    # ========================================
    # EMAIL NEWSLETTERS (banner only)
    # ========================================
    "email10_banner": {
        "page_id": "41a14b029dc145e8bacd42106ab75052",
        "section": "banner",
        "prompt": "A realistic photo of a concerned dog owner sitting on a couch in a Taiwanese apartment, looking at their phone with a puzzled expression, while a small mixed-breed dog sits nearby looking up at them with a tilted head. The scene conveys searching for bark solutions online. Warm natural light, modern Taiwanese living room. NOT cartoon, NOT illustration, 1080x540"
    },
    "email02_banner": {
        "page_id": "da8b93c3d4d34211a6d70a03a404127f",
        "section": "banner",
        "prompt": "A realistic photo of a dog owner kneeling in a cozy Taiwanese apartment living room, holding a smartphone in one hand and a small treat in the other, with a calm medium mixed-breed dog sitting attentively in front. The scene shows a doorbell desensitization training session moment. Warm natural sunlight from window, peaceful atmosphere. NOT cartoon, NOT illustration, 1080x540"
    },
    "email04_banner": {
        "page_id": "4a3b21d557114d489ab077994620b2f5",
        "section": "banner",
        "prompt": "A realistic photo of a medium tan mixed-breed dog looking through an apartment window in a Taiwanese apartment, with a slightly worried but gentle expression, ears slightly back, watching the street below. The scene conveys a dog waiting for their owner to come home. Soft warm but slightly melancholic indoor lighting. NOT cartoon, NOT illustration, 1080x540"
    },
    "email05_banner": {
        "page_id": "7c381b33574842268a08d18ab58b2744",
        "section": "banner",
        "prompt": "A realistic photo of a small mixed-breed dog on a leash in a Taiwanese community park, ears perked forward, body slightly tense, looking at another dog walking in the distance. The owner is holding the leash with a calm but attentive posture. Morning sunlight, green park setting with typical Taiwanese urban landscape including apartment buildings in the background. NOT cartoon, NOT illustration, 1080x540"
    },
    "email06_banner": {
        "page_id": "05daf0b74bd14495b166d98eeda1c8a3",
        "section": "banner",
        "prompt": "A realistic photo taken from inside a warm Taiwanese apartment looking toward the front door area, where a friend is visible entering. A medium mixed-breed dog sits calmly on a mat in the living room, looking toward the door with curious but relaxed body language. Warm cozy indoor lighting with afternoon sunlight. NOT cartoon, NOT illustration, 1080x540"
    },
    "email09_banner": {
        "page_id": "637158dc9bbf41799bb528a034ed7de4",
        "section": "banner",
        "prompt": "A realistic photo of an elderly gray-muzzled mixed-breed dog resting peacefully on a soft blanket in a warm Taiwanese apartment living room, with gentle warm evening light. The dog has a wise, slightly confused but loveable expression. A caring owner hand is gently resting near the dog. The scene is peaceful and compassionate, conveying love for a senior pet. NOT cartoon, NOT illustration, 1080x540"
    },
}

def main():
    results = {}
    total = len(TASKS)
    success = 0
    failed = 0

    print(f"=" * 60)
    print(f"Starting batch generation: {total} images")
    print(f"=" * 60)

    for i, (key, task) in enumerate(TASKS.items(), 1):
        print(f"\n[{i}/{total}] {key} (page: {task['page_id'][:8]}...)")
        url = generate_and_upload(task["prompt"], key)
        if url:
            results[key] = {
                "url": url,
                "page_id": task["page_id"],
                "section": task["section"]
            }
            success += 1
        else:
            results[key] = {
                "url": None,
                "page_id": task["page_id"],
                "section": task["section"],
                "error": "Generation or upload failed"
            }
            failed += 1

        # Save progress after each image
        with open("image_results.json", "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"BATCH COMPLETE: {success} success, {failed} failed out of {total}")
    print(f"Results saved to image_results.json")
    print(f"{'=' * 60}")

    # Print summary
    for key, r in results.items():
        status = "OK" if r.get("url") else "FAILED"
        print(f"  [{status}] {key}: {r.get('url', 'N/A')}")


if __name__ == "__main__":
    main()
