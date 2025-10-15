from pydantic import BaseModel
from typing import List, Optional, Dict

# ---------- DB tool schemas ----------

class AIToolBase(BaseModel):
    name: str
    description: str
    type: str
    input_format: str
    output_format: str
    access_type: str
    pricing: str
    limitations: str
    license: str
    examples: Optional[Dict]
    links: Optional[Dict]
    tags: List[str]
    rating: Optional[float]
    icon_url: Optional[str] = None
class AIToolCreate(AIToolBase):
    pass

class AIToolOut(AIToolBase):
    id: int

class Config:
    from_attributes = True


# ---------- Planner (/plan) schemas ----------

class PlanRequest(BaseModel):
    user_goal: str

class ToolInfo(BaseModel):
    name: str
    link: Optional[str] = None  # може да липсва при някои записи
    icon: Optional[str] = None

class TaskPlan(BaseModel):
    task: str
    tools: List[ToolInfo]

class GroupItem(BaseModel):
    title: str
    tools: List[ToolInfo]

class PlanResponse(BaseModel):
    goal: str
    plan: List[TaskPlan]
    groups: Optional[List[GroupItem]] = None  # ново поле за обединени по стъпка инструменти
