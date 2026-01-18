import resend
from app.core.config import settings

resend.api_key = settings.resend_api_key


class EmailService:

    def __init__(self):
        self.from_email = f"{settings.from_name} <{settings.from_email}>"

    def send_confirmation(
        self,
        to_email: str,
        patient_name: str,
        doctor_name: str,
        specialization: str,
        date: str,
        time: str
    ) -> bool:

        subject = "Prenotazione Clinica Orchidea"

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">Clinica Orchidea</h2>
            <p>Gentile <strong>{patient_name}</strong>,</p>
            <p>Le confermiamo il suo appuntamento:</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Dottore:</strong> Dr. {doctor_name}</p>
                <p style="margin: 5px 0;"><strong>Specializzazione:</strong> {specialization}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> {date}</p>
                <p style="margin: 5px 0;"><strong>Ora:</strong> {time}</p>
            </div>
            <p>Per modifiche o cancellazioni, acceda al portale o contatti la clinica.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
                Clinica Orchidea - Questo messaggio è stato inviato automaticamente.
            </p>
        </div>
        """

        return self._send(to_email, subject, html)

    def send_cancellation_by_patient(
        self,
        to_email: str,
        patient_name: str,
        doctor_name: str,
        date: str,
        time: str
    ) -> bool:

        subject = "Cancellazione Appuntamento - Clinica Orchidea"

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">Clinica Orchidea</h2>
            <p>Gentile <strong>{patient_name}</strong>,</p>
            <p>Confermiamo la cancellazione del suo appuntamento:</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Dottore:</strong> Dr. {doctor_name}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> {date}</p>
                <p style="margin: 5px 0;"><strong>Ora:</strong> {time}</p>
                <p style="margin: 5px 0; color: #dc2626;"><strong>Stato:</strong> Cancellato</p>
            </div>
            <p>Per prenotare un nuovo appuntamento, acceda al portale.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
                Clinica Orchidea - Questo messaggio è stato inviato automaticamente.
            </p>
        </div>
        """

        return self._send(to_email, subject, html)

    def send_cancellation_by_clinic(
        self,
        to_email: str,
        patient_name: str,
        doctor_name: str,
        date: str,
        time: str
    ) -> bool:

        subject = "Cancellazione Appuntamento - Clinica Orchidea"

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">Clinica Orchidea</h2>
            <p>Gentile <strong>{patient_name}</strong>,</p>
            <p>La informiamo che il seguente appuntamento è stato cancellato dalla clinica:</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Dottore:</strong> Dr. {doctor_name}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> {date}</p>
                <p style="margin: 5px 0;"><strong>Ora:</strong> {time}</p>
                <p style="margin: 5px 0; color: #dc2626;"><strong>Stato:</strong> Cancellato</p>
            </div>
            <p>Per ulteriori informazioni, La preghiamo di contattare la clinica.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
                Clinica Orchidea - Questo messaggio è stato inviato automaticamente.
            </p>
        </div>
        """

        return self._send(to_email, subject, html)

    def _send(self, to_email: str, subject: str, html: str) -> bool:

        if not settings.resend_api_key:
            print("api key not configured")
            return False

        try:
            resend.Emails.send({
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html
            })
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False


def get_email_service() -> EmailService:
    return EmailService()