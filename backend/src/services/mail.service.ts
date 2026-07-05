import { Resend } from "resend";
import { env } from "../config/env";

let client: Resend | null = null;

const getClient = (): Resend => {
    if (!client) {
        client = new Resend(env.RESEND_API_KEY);
    }

    return client;
};

class MailService {

    static async sendPasswordReset(to: string, resetLink: string, name: string): Promise<void> {

        await getClient().emails.send({
            from: env.EMAIL_FROM,
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