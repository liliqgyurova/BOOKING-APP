from app.db.database import engine, Base
from app.models.tool import AITool  # Импортираме и основния модел!
from app.models.translation import ToolTranslation

# Създай ВСИЧКИ таблици (ако вече съществуват, не прави нищо)
Base.metadata.create_all(bind=engine, checkfirst=True)

print("✅ Всички таблици са създадени/проверени!")
print("✅ tool_translations таблицата е готова!")