from pydantic import BaseModel


class AIResponse(BaseModel):
    response: str
    #: A short web search about the lesson's topic, set only when the learner
    #: asks for videos, links or further reading, or when outside material
    #: would clearly help. The app runs the search and attaches the results;
    #: the model never writes URLs itself.
    resource_search: str | None = None
