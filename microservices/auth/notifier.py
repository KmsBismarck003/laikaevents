import os
import aiosmtplib
from email.message import EmailMessage
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

# Configuración SMTP de Gmail
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
# Estos se deben configurar en el archivo .env o variables de entorno
SMTP_USER = os.getenv("SMTP_USER", "al222310440@gmail.com") 
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "") # Aquí irá el código de 16 letras

# Directorio de plantillas
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

class EmailNotifier:
    @staticmethod
    async def send_email(to_email: str, subject: str, template_name: str, context: dict):
        if not SMTP_PASSWORD:
            print("!!! [SMTP] Error: SMTP_PASSWORD no configurada. Correo no enviado.")
            return False

        try:
            template = jinja_env.get_template(template_name)
            html_content = template.render(context)

            message = EmailMessage()
            message["From"] = SMTP_USER
            message["To"] = to_email
            message["Subject"] = subject
            message.set_content("Por favor usa un cliente que soporte HTML.")
            message.add_alternative(html_content, subtype="html")

            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASSWORD,
                start_tls=True,
            )
            print(f"? [SMTP] Correo enviado exitosamente a {to_email}")
            return True
        except Exception as e:
            print(f"!!! [SMTP] Error al enviar correo a {to_email}: {e}")
            return False

    @staticmethod
    async def send_login_alert(user_name: str, user_email: str, provider: str = "Password"):
        context = {
            "name": user_name,
            "email": user_email,
            "date": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "provider": provider
        }
        return await EmailNotifier.send_email(
            user_email, 
            "Alerta de Seguridad: Nuevo inicio de sesión", 
            "login_alert.html", 
            context
        )

    @staticmethod
    async def broadcast_announcement(emails: list, content: str):
        success_count = 0
        for email in emails:
            res = await EmailNotifier.send_email(
                email,
                "LAIKA Club - Anuncio Importante",
                "announcement.html",
                {"content": content}
            )
            if res: success_count += 1
        return success_count
