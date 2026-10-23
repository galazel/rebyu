"""Exercise real checkpoint persistence using only a new, isolated smoke-test thread."""
import asyncio
from uuid import uuid4
from app.graphs.tutor.live_turns import coordinate_live_turn
from app.utils.helpers import close_checkpointer, get_checkpointer


async def main():
    thread = f"live-turn-smoke:{uuid4()}"
    try:
        await coordinate_live_turn(thread, {"action": "open", "sequence": 1})
        await coordinate_live_turn(thread, {"action": "typing", "active": True, "sequence": 2})
        result = await coordinate_live_turn(thread, {"action": "continue", "sequence": 3})
        assert result["phase"] == "COMPOSING" and not result["allowContinue"]
        result = await coordinate_live_turn(thread, {"action": "submit", "message": "A smoke-test answer", "sequence": 4})
        assert result["phase"] == "EVALUATING_ANSWER" and "A smoke-test answer" in result["directive"]
        result = await coordinate_live_turn(thread, {"action": "agent_message", "message": "Brief feedback", "sequence": 5})
        assert result["allowContinue"]
    finally:
        saver = await get_checkpointer()
        await saver.adelete_thread(thread)
        await close_checkpointer()
    print("PASS: PostgreSQL-backed LangGraph typing hold and LangChain submission context; test thread removed.")


if __name__ == "__main__":
    asyncio.run(main())
