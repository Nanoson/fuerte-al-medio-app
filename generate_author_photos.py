#!/usr/bin/env python3
"""
Script para generar fotos de perfil de los 17 periodistas con DALL-E
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime

# Configuración
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OUTPUT_DIR = Path("public/images/authors")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Datos de los periodistas con prompts para DALL-E
AUTHORS = [
    {
        "id": "valmont_pol",
        "name": "Sebastián Valmont",
        "prompt": "Professional headshot of Sebastián Valmont, 52-year-old Argentine economist and political analyst, serious confident expression, wearing navy business suit and light blue shirt, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "montes_pol",
        "name": "Lucía Montes",
        "prompt": "Professional headshot of Lucía Montes, 38-year-old Argentine sociologist and investigative journalist, thoughtful engaged expression, professional blazer, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "rossi_pol",
        "name": "Camila Rossi",
        "prompt": "Professional headshot of Camila Rossi, 40-year-old Argentine political analyst, confident moderate expression, professional business attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "cuesta_pol",
        "name": "Martín Cuesta",
        "prompt": "Professional headshot of Martín Cuesta, 45-year-old Argentine international correspondent, experienced seasoned journalist expression, professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "santillan_esp",
        "name": "Fabián Santillán",
        "prompt": "Professional headshot of Fabián Santillán, 48-year-old Argentine entertainment editor, charming engaging expression, stylish professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "dubois_esp",
        "name": "Mia Dubois",
        "prompt": "Professional headshot of Mia Dubois, 28-year-old young Argentine culture and trends analyst, fresh engaging expression, casual-professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "ferrero_esp",
        "name": "Bruno Ferrero",
        "prompt": "Professional headshot of Bruno Ferrero, 55-year-old Argentine film and theater critic, intense analytical expression, sophisticated professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "lemoine_esp",
        "name": "Clara Lemoine",
        "prompt": "Professional headshot of Clara Lemoine, 42-year-old Argentine culture and film journalist, refined professional expression, elegant business attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "vieri_dep",
        "name": "Héctor El Tano Vieri",
        "prompt": "Professional headshot of Héctor Vieri, 52-year-old passionate Argentine sports columnist, intense expressive face, professional casual attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "bernal_dep",
        "name": "Diego Bernal",
        "prompt": "Professional headshot of Diego Bernal, 48-year-old Argentine sports chronicler, warm expressive engaging face, professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "fassi_dep",
        "name": "Andrés Fassi",
        "prompt": "Professional headshot of Andrés Fassi, 42-year-old Argentine sports analyst and tactics expert, focused intelligent analytical expression, professional attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "conti_dep",
        "name": "Valeria Conti",
        "prompt": "Professional headshot of Valeria Conti, 38-year-old Argentine sports correspondent, professional confident expression, business casual attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "pendelton_mer",
        "name": "Arthur Pendelton",
        "prompt": "Professional headshot of Arthur Pendelton, 58-year-old financial analyst with Wall Street experience and Argentine background, experienced confident expression, formal business suit, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "damico_mer",
        "name": "Javier D'Amico",
        "prompt": "Professional headshot of Javier D'Amico, 48-year-old Argentine financial consultant and risk analyst, strategic focused expression, professional business attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "blanc_mer",
        "name": "Victoria Blanc",
        "prompt": "Professional headshot of Victoria Blanc, 48-year-old Argentine macroeconomist and financial specialist, analytical serious expression, professional business attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "herrera_mer",
        "name": "Tomás Herrera",
        "prompt": "Professional headshot of Tomás Herrera, 43-year-old Argentine financial journalist and markets reporter, neutral professional expression, business casual attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    },
    {
        "id": "hayes_soc",
        "name": "Ethan Hayes",
        "prompt": "Professional headshot of Ethan Hayes, 38-year-old British-Argentine sociologist and big data analyst, intelligent focused expression, professional casual attire, natural outdoor lighting, neutral blurred background, studio photography, high quality, realistic"
    }
]

def generate_image_with_dalle(prompt, author_id):
    """Genera una imagen con DALL-E 3 y la guarda"""
    try:
        print(f"Generando foto para {author_id}...")

        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024",
                "quality": "hd"
            }
        )

        if response.status_code == 200:
            data = response.json()
            image_url = data['data'][0]['url']

            # Descargar imagen
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                filename = f"{author_id}.png"
                filepath = OUTPUT_DIR / filename

                with open(filepath, 'wb') as f:
                    f.write(img_response.content)

                print(f"✅ Guardada: {filepath}")
                return filepath
            else:
                print(f"❌ Error descargando imagen para {author_id}")
                return None
        else:
            error = response.json()
            print(f"❌ Error DALL-E para {author_id}: {error.get('error', {}).get('message', 'Unknown')}")
            return None

    except Exception as e:
        print(f"❌ Excepción para {author_id}: {str(e)}")
        return None

def main():
    print("🎨 Iniciando generación de fotos de perfil...")
    print(f"API Key presente: {'Sí' if OPENAI_API_KEY else 'No'}")
    print(f"Guardando en: {OUTPUT_DIR.absolute()}")
    print()

    if not OPENAI_API_KEY:
        print("❌ Error: OPENAI_API_KEY no configurada")
        print("Configura: export OPENAI_API_KEY='tu-clave-aqui'")
        return

    generated_files = []

    for author in AUTHORS:
        filepath = generate_image_with_dalle(author["prompt"], author["id"])
        if filepath:
            generated_files.append({
                "id": author["id"],
                "name": author["name"],
                "file": filepath
            })

    print()
    print(f"✅ Completado: {len(generated_files)}/{len(AUTHORS)} fotos generadas")

    # Guardar registro
    log_file = OUTPUT_DIR / "generation_log.json"
    with open(log_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total": len(AUTHORS),
            "generated": len(generated_files),
            "files": generated_files
        }, f, indent=2)

    print(f"📝 Log guardado en: {log_file}")

if __name__ == "__main__":
    main()
