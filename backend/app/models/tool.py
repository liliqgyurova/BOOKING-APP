from sqlalchemy import Column, Integer, String, Float, JSON, ARRAY
from app.db.database import Base

class AITool(Base):
    __tablename__ = "ai_tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    description_en = Column(String, nullable=True)  # 🆕 Английско описание
    type = Column(String)
    input_format = Column(String)
    output_format = Column(String)
    access_type = Column(String)
    pricing = Column(String)
    limitations = Column(String)
    license = Column(String)
    examples = Column(JSON)
    links = Column(JSON)
    tags = Column(ARRAY(String))
    rating = Column(Float)
    # 🆕 икона (URL)
    icon_url = Column(String)  # nullable по подразбиране
