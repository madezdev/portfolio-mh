import type { APIRoute } from 'astro';
import { transporter, mailOptions } from '@server/nodemailer';
const emailUser = import.meta.env.PUBLIC_EMAIL_USER
// Para las imágenes de correo electrónico usamos una URL de imagen pública
const logoUrl = 'https://raw.githubusercontent.com/madezdev/portfolio-assets/main/logoMadezdev.png';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  budget?: string;
  message: string;
  language: 'es' | 'en';
}

// Email templates
const emailTemplates = {
  es: {
    toOwner: {
      subject: (subject: string) => `Nuevo contacto: ${subject}`,
      html: (data: ContactFormData) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <img src="https://res.cloudinary.com/dnwgr5lnt/image/upload/v1755119008/logoMadezdev_x4vok9.png" alt="MadezDev Logo" style="width: 300px; height: auto;">
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #3b82f6; margin-top: 0; font-weight: 600; font-size: 22px;">Nuevo mensaje de contacto</h2>
          
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Datos del contacto:</h3>
              <p style="margin-bottom: 10px;"><strong>Nombre:</strong> ${data.name}</p>
              <p style="margin-bottom: 10px;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin-bottom: 10px;"><strong>Asunto:</strong> ${data.subject}</p>
              ${data.budget ? `<p style="margin-bottom: 10px;"><strong>Presupuesto:</strong> ${data.budget}</p>` : ''}
            </div>
          
            <div style="background-color: #fff; border-left: 4px solid #3b82f6; padding: 25px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Mensaje:</h3>
              <p style="white-space: pre-wrap; color: #475569;">${data.message}</p>
            </div>
          
            <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
              Este mensaje fue enviado desde el formulario de contacto de tu portfolio.
            </p>
          </div>
          
          <div style="background-color: #0f172a; color: white; text-align: center; padding: 15px; font-size: 14px;">
            © ${new Date().getFullYear()} MadezDev
          </div>
        </div>
      `
    },
    toSender: {
      subject: 'Confirmación: Hemos recibido tu mensaje',
      html: (name: string) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <img src="https://res.cloudinary.com/dnwgr5lnt/image/upload/v1755119008/logoMadezdev_x4vok9.png" alt="MadezDev Logo" style="width: 300px; height: auto;">
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #3b82f6; margin-top: 0; font-weight: 600; font-size: 22px;">¡Gracias por contactarme!</h2>
            
            <p style="color: #334155; font-size: 16px;">Hola ${name},</p>
            
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">He recibido tu mensaje y me pondré en contacto contigo muy pronto. Normalmente respondo en un plazo de 24 horas.</p>
            
            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">¿Qué pasa ahora?</h3>
              <ul style="color: #334155; padding-left: 20px; line-height: 1.6;">
                <li>Revisaré tu mensaje cuidadosamente</li>
                <li>Te responderé con una propuesta detallada</li>
                <li>Coordinaremos una llamada si es necesario</li>
              </ul>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Mientras tanto, puedes:</p>
            <ul style="color: #334155; padding-left: 20px; line-height: 1.6;">
              <li>Revisar mis proyectos en <a href="https://github.com/martin-dev" style="color: #3b82f6; text-decoration: none; font-weight: 500;">GitHub</a></li>
              <li>Conectar conmigo en <a href="https://linkedin.com/in/martin-dev" style="color: #3b82f6; text-decoration: none; font-weight: 500;">LinkedIn</a></li>
              <li>Seguirme en mis redes sociales</li>
            </ul>
            
            <p style="color: #334155; font-size: 16px; margin-top: 25px;">¡Espero trabajar contigo pronto!</p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 30px;">
              <table style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="https://res.cloudinary.com/dnwgr5lnt/image/upload/v1755119011/logoMadezdev-3_sbhydn.png" alt="MadezDev Logo" style="width: 60px; height: auto; margin-right: 15px;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0;"><strong>Martin Hernandez</strong><br>
                    Desarrollador Full Stack & Diseñador UX/UI<br>
                    <a href="mailto:madezdev@gmail.com" style="color: #3b82f6; text-decoration: none;">madezdev@gmail.com</a></p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background-color: #0f172a; color: white; text-align: center; padding: 15px; font-size: 14px;">
            © ${new Date().getFullYear()} MadezDev | Todos los derechos reservados
          </div>
        </div>
      `
    }
  },
  en: {
    toOwner: {
      subject: (subject: string) => `New Contact: ${subject}`,
      html: (data: ContactFormData) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <!-- <img src="${logoUrl}" alt="MadezDev Logo" style="width: 180px; height: auto;"> -->
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #3b82f6; margin-top: 0; font-weight: 600; font-size: 22px;">New Contact Message</h2>
          
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Contact Details:</h3>
              <p style="margin-bottom: 10px;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin-bottom: 10px;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin-bottom: 10px;"><strong>Subject:</strong> ${data.subject}</p>
              ${data.budget ? `<p style="margin-bottom: 10px;"><strong>Budget:</strong> ${data.budget}</p>` : ''}
            </div>
          
            <div style="background-color: #fff; border-left: 4px solid #3b82f6; padding: 25px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Message:</h3>
              <p style="white-space: pre-wrap; color: #475569;">${data.message}</p>
            </div>
          
            <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
              This message was sent from your portfolio contact form.
            </p>
          </div>
          
          <div style="background-color: #0f172a; color: white; text-align: center; padding: 15px; font-size: 14px;">
            © ${new Date().getFullYear()} MadezDev
          </div>
        </div>
      `
    },
    toSender: {
      subject: 'Confirmation: We received your message',
      html: (name: string) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <!-- <img src="${logoUrl}" alt="MadezDev Logo" style="width: 180px; height: auto;"> -->
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #3b82f6; margin-top: 0; font-weight: 600; font-size: 22px;">Thank you for reaching out!</h2>
            
            <p style="color: #334155; font-size: 16px;">Hello ${name},</p>
            
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">I've received your message and will get back to you very soon. I typically respond within 24 hours.</p>
            
            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">What happens next?</h3>
              <ul style="color: #334155; padding-left: 20px; line-height: 1.6;">
                <li>I'll review your message carefully</li>
                <li>I'll respond with a detailed proposal</li>
                <li>We'll schedule a call if needed</li>
              </ul>
            </div>
            
            <p style="color: #334155; font-size: 16px;">In the meantime, you can:</p>
            <ul style="color: #334155; padding-left: 20px; line-height: 1.6;">
              <li>Check out my projects on <a href="https://github.com/martin-dev" style="color: #3b82f6; text-decoration: none; font-weight: 500;">GitHub</a></li>
              <li>Connect with me on <a href="https://linkedin.com/in/martin-dev" style="color: #3b82f6; text-decoration: none; font-weight: 500;">LinkedIn</a></li>
              <li>Follow me on social media</li>
            </ul>
            
            <p style="color: #334155; font-size: 16px; margin-top: 25px;">Looking forward to working with you!</p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 30px;">
              <table style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="https://res.cloudinary.com/dnwgr5lnt/image/upload/v1755119011/logoMadezdev-3_sbhydn.png" alt="MadezDev Logo" style="width: 60px; height: auto; margin-right: 15px;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0;"><strong>Martin Hernandez</strong><br>
                    Full Stack Developer & UX/UI Designer<br>
                    <a href="mailto:madezdev@gmail.com" style="color: #3b82f6; text-decoration: none;">madezdev@gmail.com</a></p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background-color: #0f172a; color: white; text-align: center; padding: 15px; font-size: 14px;">
            © ${new Date().getFullYear()} MadezDev | All rights reserved
          </div>
        </div>
      `
    }
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json() as ContactFormData;

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const templates = emailTemplates[formData.language || 'es'];

    // Email to owner (you)
    const ownerMailOptions = {
      ...mailOptions,
      from: emailUser,
      to: 'madezdev@gmail.com',
      subject: templates.toOwner.subject(formData.subject),
      html: templates.toOwner.html(formData),
      replyTo: formData.email
    };

    // Confirmation email to sender
    const senderMailOptions = {
      ...mailOptions,
      from: emailUser,
      to: formData.email,
      subject: templates.toSender.subject,
      html: templates.toSender.html(formData.name)
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(ownerMailOptions),
      transporter.sendMail(senderMailOptions)
    ]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Emails sent successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email sending error:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to send email'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};