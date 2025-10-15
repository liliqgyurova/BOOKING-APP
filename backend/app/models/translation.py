from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base

class ToolTranslation(Base):
    __tablename__ = "tool_translations"
    
    id = Column(Integer, primary_key=True, index=True)
    tool_id = Column(Integer, ForeignKey("ai_tools.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), nullable=False, index=True)  # bg, en, es, de...
    field = Column(String(50), nullable=False)  # description, name, etc.
    value = Column(Text, nullable=False)
    
    # Relationship
    tool = relationship("AITool", backref="translations")
    
    # Уникално ограничение: един tool може да има само един превод за дадено поле на даден език
    __table_args__ = (
        UniqueConstraint('tool_id', 'language', 'field', name='uix_tool_lang_field'),
    )