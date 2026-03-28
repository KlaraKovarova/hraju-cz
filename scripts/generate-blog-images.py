#!/usr/bin/env python3
"""Generate hero images for blog posts missing them using Recraft API."""

import os
import sys
import json
import time
import urllib.request
import re
from pathlib import Path

RECRAFT_API_KEY = os.environ.get("RECRAFT_API_KEY")
BLOG_DIR = Path("/Users/klara/Weby/hraju.cz/content/blog")
IMG_DIR = Path("/Users/klara/Weby/hraju.cz/public/images/blog")

# Slug → Recraft prompt mapping
PROMPTS = {
    "badminton-pro-zacatecniky-kompletni-pruvodce": "Young adults learning badminton in an indoor sports hall, beginner players practicing with rackets and shuttlecock, bright gym, realistic photography",
    "basketbal-pro-zacatecniky-kompletni-pruvodce": "Young adults playing basketball on an indoor court, shooting hoops, action photography, Czech sports hall, bright lighting",
    "behani-pro-zacatecniky-kompletni-pruvodce": "Young woman running outdoors in a park on a sunny morning, beginner runner, jogging path, fresh air, realistic photography",
    "bojove-sporty-pruvodce-pro-zacatecniky": "Young people practicing martial arts in a dojo, beginners learning karate or judo, gi uniforms, Czech sports center, realistic photography",
    "bouldering-pro-zacatecniky-kompletni-pruvodce": "Young woman bouldering on a colorful indoor climbing wall, beginner climber reaching for holds, chalk on hands, gym setting, realistic photography",
    "crossfit-a-funkcni-trenink-pruvodce": "Group of people doing CrossFit workout in a gym, functional training with barbells and pull-up bars, energetic atmosphere, realistic photography",
    "cviceni-doma-bez-vybaveni-kompletni-pruvodce": "Young woman doing home workout exercises on a yoga mat in a bright living room, bodyweight training, no equipment, realistic photography",
    "cyklistika-pro-zacatecniky-kompletni-pruvodce": "Young adult cycling on a road bike through Czech countryside on a sunny day, beginner cyclist, helmet, scenic route, realistic photography",
    "etiketa-v-posilovne-pruvodce": "Well-organized modern gym with people working out respectfully, clean equipment, polite gym etiquette, Czech fitness center, realistic photography",
    "ferraty-v-cesku-kompletni-pruvodce-2026": "Climber on a via ferrata route in Czech rock formations, steel ladder and cable, dramatic cliff scenery, safety harness, realistic photography",
    "florbal-pro-zacatecniky-kompletni-pruvodce": "Young adults playing floorball in an indoor hall, players with sticks chasing the ball, Czech sports hall, action shot, realistic photography",
    "fotbal-pro-zacatecniky-kompletni-pruvodce": "Young adults playing football on a grass pitch, beginner players kicking the ball, sunny day, Czech sports facility, realistic photography",
    "golf-pro-zacatecniky-kompletni-pruvodce": "Beginner golfer practicing swing on a green golf course, Czech landscape, sunny day, golf club in hands, realistic photography",
    "hazena-pro-zacatecniky-kompletni-pruvodce": "Young people playing handball in an indoor sports hall, players passing and shooting at goal, Czech sports center, realistic photography",
    "hokej-pro-zacatecniky-kompletni-pruvodce": "Beginner ice hockey players on an ice rink, learning to skate with hockey sticks, indoor ice arena, Czech sports hall, realistic photography",
    "indoor-sporty-kdyz-prsi": "Collage view of various indoor sports activities — badminton, table tennis, swimming pool, squash court, rainy weather outside, Czech sports complex, realistic photography",
    "inline-brusleni-pro-zacatecniky-pruvodce": "Young woman inline skating on a smooth path in a Czech park, protective gear, sunny day, beginner skater, realistic photography",
    "jak-najit-sportovniho-partnera": "Two friends meeting at a sports facility to play tennis together, friendly atmosphere, Czech sports center, realistic photography",
    "jak-predejit-zraneni-pri-sportu": "Athletic person doing proper warm-up stretching before exercise, injury prevention routine, bright gym or outdoor setting, realistic photography",
    "jak-usetrit-za-sport-v-cesku": "Person comparing sports facility prices on a smartphone, budget-conscious sports planning, Czech city background, realistic photography",
    "jak-vybrat-posilovnu-pruvodce": "Person touring a modern gym, evaluating equipment and facilities, bright fitness center, Czech city, realistic photography",
    "jak-zacit-behat-pruvodce-pro-zacatecniky": "Young woman starting her first run in a park, comfortable running shoes, early morning, motivated expression, Czech park, realistic photography",
    "jak-zacit-pravidelne-sportovat": "Person lacing up sneakers preparing for a workout, motivation to start exercising, bright and energetic atmosphere, realistic photography",
    "jaky-sport-zacit-pruvodce-vyberem": "Person standing at a sports complex looking at various sport options — tennis court, swimming pool, gym entrance, Czech facility, realistic photography",
    "joga-pro-zacatecniky-kompletni-pruvodce": "Young woman practicing yoga in a bright studio, beginner yoga pose on a mat, peaceful atmosphere, Czech yoga studio, realistic photography",
    "kde-sportovat-s-detmi-pruvodce": "Parent and children playing sports together at a Czech sports facility, family fun, outdoor playground or sports court, realistic photography",
    "kde-sportovat-v-ceskych-budejovicich-pruvodce": "Sports facilities in České Budějovice, Czech city sports center exterior or indoor court, athletes exercising, realistic photography",
    "kde-sportovat-v-chomutove-pruvodce": "Modern sports center in a Czech city, indoor facility with multiple sports, athletes in action, realistic photography",
    "kde-sportovat-v-decine-pruvodce": "Sports complex near a Czech river town, athletes using outdoor and indoor facilities, active lifestyle, realistic photography",
    "kde-sportovat-v-havirove-pruvodce": "Modern sports facility in Czech industrial city, indoor sports hall with multiple activities, athletes, realistic photography",
    "kde-sportovat-v-hradci-kralove": "Sports facilities in Hradec Králové, Czech city sports center, athletes playing various sports, sunny day, realistic photography",
    "kde-sportovat-v-jihlave-pruvodce": "Sports complex in Jihlava Czech city, indoor and outdoor facilities, active people, realistic photography",
    "kde-sportovat-v-karlovych-varech-pruvodce": "Sports facilities in Karlovy Vary spa town, athletes enjoying active lifestyle among spa architecture, realistic photography",
    "kde-sportovat-v-karvine-pruvodce": "Modern sports hall in Karviná Czech city, indoor sports facilities, athletes in action, realistic photography",
    "kde-sportovat-v-kladne-pruvodce": "Sports center in Kladno Czech city, indoor sports hall or outdoor court, active athletes, realistic photography",
    "kde-sportovat-v-liberci-pruvodce": "Sports facilities in Liberec with mountain backdrop, Czech city sports complex, athletes, realistic photography",
    "kde-sportovat-v-mlade-boleslavi-pruvodce": "Sports hall in Mladá Boleslav Czech city, indoor facilities, athletes playing sports, realistic photography",
    "kde-sportovat-v-moste-pruvodce": "Modern sports complex in Most Czech city, indoor facilities with swimming pool or courts, athletes, realistic photography",
    "kde-sportovat-v-olomouci-pruvodce": "Sports facilities in Olomouc historic Czech city, modern gym or sports hall near historic architecture, athletes, realistic photography",
    "kde-sportovat-v-opave-pruvodce": "Sports complex in Opava Czech city, indoor sports hall, athletes in various sports, realistic photography",
    "kde-sportovat-v-pardubicich-pruvodce": "Sports facilities in Pardubice Czech city, indoor hall or outdoor courts, active athletes, realistic photography",
    "kde-sportovat-v-prerove-pruvodce": "Sports complex in Přerov Czech city, indoor facilities, athletes in action, realistic photography",
    "kde-sportovat-v-prostejove-pruvodce": "Tennis courts in Prostějov Czech city famous for tennis, outdoor clay courts, players, sunny day, realistic photography",
    "kde-sportovat-v-teplicich-pruvodce": "Sports facilities in Teplice Czech spa city, modern indoor complex, athletes, realistic photography",
    "kde-sportovat-v-trinci-pruvodce": "Sports hall in Třinec Czech city, indoor facilities, athletes in action, realistic photography",
    "kde-sportovat-v-usti-nad-labem-pruvodce": "Sports complex in Ústí nad Labem Czech city along river, modern facilities, athletes, realistic photography",
    "kde-sportovat-ve-frydku-mistku-pruvodce": "Sports facilities in Frýdek-Místek Czech city, indoor hall, athletes playing sports, realistic photography",
    "kde-sportovat-ve-zline-pruvodce": "Modern sports complex in Zlín Czech city, indoor facilities, athletes, bright atmosphere, realistic photography",
    "kolik-stoji-sport-v-cesku-2026": "Price comparison chart concept for sports in Czech Republic, person checking sports costs on tablet, gym or sports facility background, realistic photography",
    "lyzovani-v-cesku-pruvodce-pro-zacatecniky": "Beginner skier on a Czech ski slope with gentle terrain, winter sports, mountain resort, snow, realistic photography",
    "nejlepsi-bouldrovky-v-cesku-2026": "Interior of the best bouldering gym in Czech Republic, colorful climbing walls, multiple climbers, modern facility, realistic photography",
    "nejlepsi-sporty-na-leto-2026": "Group of friends enjoying various outdoor summer sports in Czech Republic, beach volleyball, cycling, swimming, sunny day, realistic photography",
    "nejlepsi-sporty-pro-zacatecniky-nad-30": "Adults over 30 starting new sports activities, tennis lesson or swimming class, friendly coach, Czech sports facility, realistic photography",
    "nohejbal-pro-zacatecniky-kompletni-pruvodce": "Players playing footvolley nohejbal on an outdoor court, Czech summer sport, net play, realistic photography",
    "outdoorove-sporty-v-cesku-pruvodce": "Hikers and cyclists enjoying Czech nature outdoors, Bohemian landscape, mountains and forests, active lifestyle, realistic photography",
    "plavani-pro-dospele-jak-se-naucit": "Adult learning to swim with instructor in an indoor pool, Czech swimming facility, goggles and swimming cap, realistic photography",
    "plavani-pro-zacatecniky-kompletni-pruvodce": "Person learning basic swimming technique in an indoor pool, beginner swimmer, Czech aquatic center, clear blue water, realistic photography",
    "posilovna-pro-zacatecniky-kompletni-pruvodce": "Beginner doing first gym workout with trainer guidance, weights and machines, modern Czech gym, realistic photography",
    "prevence-sportovnich-zraneni-pruvodce": "Athlete doing proper warm-up and stretching exercises before sport, injury prevention focus, Czech gym or outdoor setting, realistic photography",
    "protahovani-a-flexibilita-pruvodce": "Person doing stretching and flexibility exercises on a mat, various stretch positions, bright gym or home setting, realistic photography",
    "prvni-navsteva-sportoviste-co-cekat": "First-time visitor being welcomed at a Czech sports facility, friendly staff reception, modern sports center entrance, realistic photography",
    "raketove-sporty-porovnani": "Three racket sports equipment displayed — tennis racket, squash racket, badminton racket, sports balls and shuttlecock, realistic photography",
    "rozcviceni-a-protazeni-pruvodce": "Athlete doing warm-up routine and cool-down stretches in a gym, proper pre and post workout routine, Czech sports facility, realistic photography",
    "sport-a-dusevni-zdravi-jak-pohyb-pomaha": "Happy person feeling refreshed after exercise outdoors, mental health and sport connection, smiling athlete, Czech park or gym, realistic photography",
    "sport-a-dusevni-zdravi-pruvodce": "Peaceful yoga or meditation session after sport, mental wellness through physical activity, calm Czech sports environment, realistic photography",
    "sport-pro-seniory-jak-zacit-bezpecne": "Active senior adults exercising safely at a Czech sports facility, gentle fitness class or swimming, over 60 participants, realistic photography",
    "sport-s-detmi-jak-motivovat-deti-ke-sportu": "Enthusiastic children playing sports with parent coach, football or basketball, Czech sports facility, kids having fun, realistic photography",
    "sportovni-aplikace-a-technologie-pruvodce": "Athlete using fitness tracking app on smartphone while exercising, sports technology, Czech gym or outdoor setting, realistic photography",
    "sportovni-psychologie-motivace-pruvodce": "Focused athlete visualizing success before competition, mental training, sports psychology, Czech sports setting, realistic photography",
    "sportovni-vyziva-zaklady-pruvodce": "Healthy sports nutrition meal prep — protein foods, vegetables, sports supplements, athlete eating well, realistic photography",
    "sporty-do-deste-kam-v-cesku": "Indoor sports during rainy weather — squash court or swimming pool visible through window with rain outside, Czech facility, realistic photography",
    "sporty-pro-pary-kam-jit-spolu": "Couple playing tennis together at a Czech sports facility, fun sporty date activity, realistic photography",
    "squash-pro-zacatecniky-kompletni-pruvodce": "Beginner playing squash in a Czech squash court, learning the sport, glass-walled court, racket in hand, realistic photography",
    "stolni-tenis-pro-zacatecniky-kompletni-pruvodce": "Young adults playing table tennis in a Czech sports hall, paddle and ball in action, friendly game, realistic photography",
    "stravovani-pro-sportovce-kompletni-pruvodce": "Athlete preparing healthy pre-workout meal with proteins and carbohydrates, sports nutrition in Czech kitchen, realistic photography",
    "stretching-po-sportu-pruvodce": "Athlete doing post-workout stretching on a gym mat, cool-down routine after exercise, Czech fitness center, realistic photography",
    "tanec-a-zumba-fitness-pruvodce": "Energetic Zumba dance fitness class in a Czech studio, group of women dancing, colorful workout outfits, upbeat atmosphere, realistic photography",
    "tenis-pro-zacatecniky-kompletni-pruvodce": "Beginner learning tennis on a Czech clay court, forehand stroke practice, sunny day, coach watching, realistic photography",
    "turistika-a-hiking-v-cesku-pruvodce": "Hikers on a trail in Czech bohemian forests or mountains, marked hiking path, nature scenery, backpacks, realistic photography",
    "tymove-sporty-pro-dospele-pruvodce": "Adult recreational sports team celebrating after a game, volleyball or basketball team in Czech sports hall, friendly atmosphere, realistic photography",
    "venkovni-sezona-2026-kdy-zacit": "Spring outdoor sports scene in Czech Republic, cyclists and joggers in a park, flowers blooming, beginning of outdoor season, realistic photography",
    "vodni-sporty-v-cesku-pruvodce": "Kayaking or paddleboarding on a Czech river or lake, water sports in bohemian landscape, clear water, sunny day, realistic photography",
    "volejbal-pro-zacatecniky-jak-zacit": "Beginners learning volleyball techniques in a Czech sports hall, serving and passing practice, net game, realistic photography",
    "volejbal-pro-zacatecniky-kompletni-pruvodce": "Young adults playing indoor volleyball in Czech sports hall, spiking the ball over the net, competitive play, realistic photography",
    "zimni-sporty-v-cesku-krome-lyzovani-pruvodce": "Winter sports in Czech Republic excluding skiing — ice skating on outdoor rink, Czech winter atmosphere, snow, realistic photography",
}


def generate_image(slug, prompt):
    """Generate an image and return the URL."""
    data = json.dumps({
        "prompt": prompt,
        "style": "realistic_image",
        "size": "1820x1024"
    }).encode()

    req = urllib.request.Request(
        "https://external.api.recraft.ai/v1/images/generations",
        data=data,
        headers={
            "Authorization": f"Bearer {RECRAFT_API_KEY}",
            "Content-Type": "application/json"
        }
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())

    return result["data"][0]["url"]


def download_image(url, dest_path):
    """Download image from URL to dest_path."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        with open(dest_path, "wb") as f:
            f.write(resp.read())


def add_image_to_frontmatter(md_path, image_path):
    """Add image field to post frontmatter."""
    content = md_path.read_text()

    # Find the frontmatter end (second ---)
    lines = content.split("\n")
    fm_end = -1
    count = 0
    for i, line in enumerate(lines):
        if line.strip() == "---":
            count += 1
            if count == 2:
                fm_end = i
                break

    if fm_end == -1:
        print(f"  WARNING: No frontmatter found in {md_path.name}")
        return False

    # Check if image already exists
    for line in lines[:fm_end]:
        if line.startswith("image:"):
            print(f"  SKIP: {md_path.name} already has image")
            return False

    # Insert image field before the closing ---
    lines.insert(fm_end, f"image: {image_path}")
    md_path.write_text("\n".join(lines))
    return True


def main():
    if not RECRAFT_API_KEY:
        print("ERROR: RECRAFT_API_KEY not set")
        sys.exit(1)

    IMG_DIR.mkdir(parents=True, exist_ok=True)

    # Find all posts missing images
    missing = []
    for md_file in sorted(BLOG_DIR.glob("*.md")):
        slug = md_file.stem
        content = md_file.read_text()
        if not re.search(r"^image:", content, re.MULTILINE):
            missing.append((slug, md_file))

    print(f"Found {len(missing)} posts missing images\n")

    # Only process posts that have prompts defined
    to_process = [(slug, md_file) for slug, md_file in missing if slug in PROMPTS]
    no_prompt = [(slug, md_file) for slug, md_file in missing if slug not in PROMPTS]

    if no_prompt:
        print(f"WARNING: {len(no_prompt)} posts have no prompt defined:")
        for slug, _ in no_prompt:
            print(f"  - {slug}")
        print()

    print(f"Processing {len(to_process)} posts with prompts...\n")

    # Check for already-generated images (allow resume)
    start_from = int(sys.argv[1]) if len(sys.argv) > 1 else 0

    for i, (slug, md_file) in enumerate(to_process):
        if i < start_from:
            continue

        img_dest = IMG_DIR / f"{slug}.jpg"

        if img_dest.exists():
            print(f"[{i+1}/{len(to_process)}] EXISTS: {slug}")
            # Still update frontmatter if needed
            add_image_to_frontmatter(md_file, f"/images/blog/{slug}.jpg")
            continue

        print(f"[{i+1}/{len(to_process)}] Generating: {slug}")
        print(f"  Prompt: {PROMPTS[slug][:80]}...")

        try:
            img_url = generate_image(slug, PROMPTS[slug])
            print(f"  Generated: {img_url[:60]}...")

            download_image(img_url, img_dest)
            print(f"  Saved: {img_dest.name}")

            if add_image_to_frontmatter(md_file, f"/images/blog/{slug}.jpg"):
                print(f"  Updated frontmatter")

            # Small delay to be respectful of API
            time.sleep(0.5)

        except Exception as e:
            print(f"  ERROR: {e}")
            # Continue with next post

    print("\nDone!")

    # Final count
    remaining = 0
    for md_file in BLOG_DIR.glob("*.md"):
        content = md_file.read_text()
        if not re.search(r"^image:", content, re.MULTILINE):
            remaining += 1
    print(f"Posts still missing images: {remaining}")


if __name__ == "__main__":
    main()
