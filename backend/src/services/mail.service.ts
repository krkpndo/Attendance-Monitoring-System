import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

class MailService {

    static async sendPasswordReset(to: string, resetLink: string, name: string): Promise<void> {

        await resend.emails.send({
            from: process.env.EMAIL_FROM as string,
            to,
            subject: 'Request for Password Reset',
            html: `
                <p>Hello ${name}, you requested a password reset.</p>
                <p><a href="${resetLink}">Click here to reset your password</a></p>
                <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
            `,
        });
    }
}

export default MailService;