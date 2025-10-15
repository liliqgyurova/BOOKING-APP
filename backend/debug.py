# backend/debug.py
from app.db.database import SessionLocal
from app.models.tool import AITool

def check_database():
    db = SessionLocal()
    try:
        # 1. Провери общо количество инструменти
        total = db.query(AITool).count()
        print(f"Общо инструменти в базата: {total}")
        
        # 2. Покажи първите 5 инструмента
        tools = db.query(AITool).limit(5).all()
        print("\nПървите 5 инструмента:")
        for tool in tools:
            print(f"- {tool.name}: {tool.tags}")
        
        # 3. Провери дали има cap:* тагове
        tools_with_caps = db.query(AITool).filter(AITool.tags.any("cap:text-explain")).limit(3).all()
        print(f"\nИнструменти с cap:text-explain таг: {len(tools_with_caps)}")
        for tool in tools_with_caps:
            print(f"- {tool.name}")
            
        # 4. Изброй всички уникални тагове
        all_tools = db.query(AITool).all()
        all_tags = set()
        for tool in all_tools:
            if tool.tags:
                all_tags.update(tool.tags)
        
        cap_tags = [tag for tag in all_tags if tag.startswith("cap:")]
        print(f"\nНамерени cap:* тагове: {len(cap_tags)}")
        for tag in sorted(cap_tags):
            print(f"- {tag}")
            
    finally:
        db.close()

def clear_and_reseed():
    db = SessionLocal()
    try:
        # Изчисти всички записи
        deleted = db.query(AITool).delete()
        db.commit()
        print(f"Изтрити {deleted} записа")
        
        # Направи ново seed-ване
        from app.seed_tools import seed_embedded_catalog
        seed_embedded_catalog()
        
        # Провери резултата
        total = db.query(AITool).count()
        print(f"След seed-ване: {total} инструмента")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=== ПРОВЕРКА НА БАЗАТА ===")
    check_database()
    
    print("\n" + "="*50)
    response = input("Искаш ли да изчистиш базата и направиш ново seed-ване? (y/n): ")
    
    if response.lower() == 'y':
        print("\n=== ИЗЧИСТВАНЕ И НОВО SEED-ВАНЕ ===")
        clear_and_reseed()
        
        print("\n=== ФИНАЛНА ПРОВЕРКА ===")
        check_database()
    else:
        print("Готово - само проверка.")