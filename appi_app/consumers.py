import json
from channels.generic.websocket import AsyncWebsocketConsumer


class AlertsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(code=4401)
            return

        is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))

        if not is_admin:
            await self.close(code=4403)
            return

        self.group_name = "admins_alerts"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # optional: повідомлення про підключення
        await self.send(text_data=json.dumps({"type": "connected", "message": "WS connected"}))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def admin_alert(self, event):
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps(payload))