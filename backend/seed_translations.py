from app.db.database import SessionLocal
from app.models.tool import AITool
from app.models.translation import ToolTranslation

# Примерни английски описания
EN_DESCRIPTIONS = {
    "Anyword": "AI-powered marketing copywriting platform",
    "Copy.ai": "AI copywriting and content creation assistant",
    "Google NotebookLM": "AI-powered note-taking and research tool",
    "Grammarly": "Grammar checking and writing enhancement tool",
    "Jasper": "AI content creation for marketing and business",
    "ChatGPT": "Conversational AI assistant by OpenAI",
    "Claude": "AI assistant by Anthropic",
    "Midjourney": "AI image generation platform",
    "DALL-E": "AI image generator by OpenAI",
    "Stable Diffusion": "Open-source AI image generation",
    # Добави още тук...
}

def seed_translations():
    db = SessionLocal()
    
    try:
        # Вземи всички инструменти
        tools = db.query(AITool).all()
        added = 0
        
        for tool in tools:
            # Добави български превод (от съществуващото description)
            if tool.description:
                existing_bg = db.query(ToolTranslation).filter(
                    ToolTranslation.tool_id == tool.id,
                    ToolTranslation.language == "bg",
                    ToolTranslation.field == "description"
                ).first()
                
                if not existing_bg:
                    bg_trans = ToolTranslation(
                        tool_id=tool.id,
                        language="bg",
                        field="description",
                        value=tool.description
                    )
                    db.add(bg_trans)
                    added += 1
            
            # Добави английски превод (ако има)
            if tool.name in EN_DESCRIPTIONS:
                existing_en = db.query(ToolTranslation).filter(
                    ToolTranslation.tool_id == tool.id,
                    ToolTranslation.language == "en",
                    ToolTranslation.field == "description"
                ).first()
                
                if not existing_en:
                    en_trans = ToolTranslation(
                        tool_id=tool.id,
                        language="en",
                        field="description",
                        value=EN_DESCRIPTIONS[tool.name]
                    )
                    db.add(en_trans)
                    added += 1
        
        db.commit()
        print(f"✅ Добавени {added} превода!")
        print(f"📊 Общо инструменти: {len(tools)}")
        
        # Покажи статистика
        bg_count = db.query(ToolTranslation).filter(ToolTranslation.language == "bg").count()
        en_count = db.query(ToolTranslation).filter(ToolTranslation.language == "en").count()
        print(f"   BG преводи: {bg_count}")
        print(f"   EN преводи: {en_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Грешка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_translations()