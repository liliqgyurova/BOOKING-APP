from sqlalchemy.orm import Session
from app.models.tool import AITool
from app.schemas.tool_schema import AIToolCreate

def get_all_tools(db: Session):
    return db.query(AITool).all()

def create_tool(db: Session, tool: AIToolCreate):
    db_tool = AITool(**tool.dict())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool
