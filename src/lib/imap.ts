import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface ParsedEmail {
  messageId: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  code: string | null;
  link: string | null;
  emailType: 'verification' | 'geo_confirmation' | 'home_confirmation' | 'login_alert' | 'other';
  receivedAt: Date;
}

function isNetflixEmail(from: string): boolean {
  const lower = from.toLowerCase();
  return lower.includes('netflix');
}

function extractCode(text: string, subject: string): string | null {
  const combined = (subject + ' ' + text).toLowerCase();
  
  // NEVER extract codes from "change account" / "cambiar cuenta" / password change emails
  if (
    combined.includes('cambiar la información de tu cuenta') ||
    combined.includes('change your account') ||
    combined.includes('cambia tu contraseña') ||
    combined.includes('change your password') ||
    combined.includes('actualizar tu contraseña') ||
    combined.includes('update your password')
  ) {
    return null;
  }

  // Netflix sign-in codes are typically 4 digits (sometimes 6)
  // "Ingresa este código para iniciar sesión" -> 4 digit code
  // "Tu código de verificación" for account changes -> 6 digits (SKIP)
  
  const patterns = [
    // Spanish: "Ingresa este código para iniciar sesión\n4973"
    /ingresa este c[oó]digo[^\n]*\n\s*(\d{4})\s*\n/i,
    // "código de verificación: 1234" or "código: 1234"
    /c[oó]digo[:\s]+(\d{4,6})/i,
    // English: "Enter this code to sign in\n4973"  
    /enter this code[^\n]*\n\s*(\d{4})\s*\n/i,
    /code[:\s]+(\d{4,6})/i,
    // "verification code: 123456"
    /verification[:\s]*(\d{4,6})/i,
    /PIN[:\s]*(\d{4,6})/i,
    // Code on its own line (common format)
    /(?:^|\n)\s*(\d{4})\s*(?:\n|$)/m,
    // Your code is / tu código es
    /(?:your code is|tu c[oó]digo es)[:\s]*(\d{4,6})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractLink(html: string, subject: string): string | null {
  const combined = (subject + ' ' + html).toLowerCase();

  // NEVER extract links from account change emails
  if (
    combined.includes('cambiar la información de tu cuenta') ||
    combined.includes('change your account') ||
    combined.includes('cambia tu contraseña') ||
    combined.includes('change your password')
  ) {
    return null;
  }

  // Netflix confirmation/action links
  const patterns = [
    // "Obtener código" link (temp access / travel)
    /href="(https:\/\/www\.netflix\.com\/[^"]*(?:tempaccess|temp_access|travel|trave|device)[^"]*)"/i,
    // "Sí, la envié yo" / confirm home link
    /href="(https:\/\/www\.netflix\.com\/[^"]*(?:confirmhome|confirm_home|homeconfirmation|home_confirmation|approve)[^"]*)"/i,
    // General confirmation links
    /href="(https:\/\/www\.netflix\.com\/[^"]*confirm[^"]*)"/i,
    // Verify links
    /href="(https:\/\/www\.netflix\.com\/[^"]*verify[^"]*)"/i,
    // Device/auth links
    /href="(https:\/\/www\.netflix\.com\/[^"]*device[^"]*)"/i,
    // Authenticate links
    /href="(https:\/\/www\.netflix\.com\/[^"]*authenticate[^"]*)"/i,
    // Account access (sign-in verification)
    /href="(https:\/\/www\.netflix\.com\/accountaccess[^"]*)"/i,
    // Any netflix.com/action or netflix.com/validate link
    /href="(https:\/\/www\.netflix\.com\/[^"]*(?:action|validate|approve|deny)[^"]*)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&');
  }
  return null;
}

function classifyEmail(subject: string, body: string): ParsedEmail['emailType'] {
  const combined = (subject + ' ' + body).toLowerCase();
  
  // Account change / password change -> SKIP entirely (mark as 'other')
  if (
    combined.includes('cambiar la información de tu cuenta') ||
    combined.includes('change your account') ||
    combined.includes('confirma el cambio en tu cuenta') ||
    combined.includes('confirm the change to your account')
  ) {
    return 'other'; // Will be filtered out
  }

  // Home confirmation: "Importante: Cómo actualizar tu Hogar con Netflix"
  if (
    combined.includes('actualizar el hogar') ||
    combined.includes('update your home') ||
    combined.includes('hogar con netflix') ||
    combined.includes('home with netflix') ||
    combined.includes('sí, la envié yo') ||
    combined.includes('yes, i sent this')
  ) {
    return 'home_confirmation';
  }

  // Temp access / travel: "Tu código de acceso temporal de Netflix"
  if (
    combined.includes('código de acceso temporal') ||
    combined.includes('temporary access code') ||
    combined.includes('acceso temporal') ||
    combined.includes('temporary access') ||
    combined.includes('viaje') ||
    combined.includes('travel') ||
    combined.includes('geolocal') ||
    combined.includes('geo-verification') ||
    combined.includes('ubicación') ||
    combined.includes('location') ||
    combined.includes('unusual sign-in') ||
    combined.includes('inicio de sesión inusual') ||
    combined.includes('new device') ||
    combined.includes('nuevo dispositivo') ||
    combined.includes('verify your identity') ||
    combined.includes('verifica tu identidad')
  ) {
    return 'geo_confirmation';
  }

  // Sign-in code: "Ingresa este código para iniciar sesión"
  if (
    combined.includes('código de inicio de sesión') ||
    combined.includes('sign-in code') ||
    combined.includes('código para iniciar sesión') ||
    combined.includes('code to sign in') ||
    combined.includes('ingresa este código') ||
    combined.includes('enter this code') ||
    combined.includes('verification code') ||
    combined.includes('código de verificación') ||
    combined.includes('verify your email') ||
    combined.includes('verifica tu correo')
  ) {
    return 'verification';
  }

  // Login alerts
  if (
    combined.includes('new sign-in') ||
    combined.includes('nuevo inicio de sesión') ||
    combined.includes('signed in') ||
    combined.includes('inició sesión')
  ) {
    return 'login_alert';
  }

  return 'other';
}

function isImportantEmail(emailType: ParsedEmail['emailType'], subject: string): boolean {
  // Skip marketing emails and account change emails
  if (emailType === 'other') {
    const lower = subject.toLowerCase();
    // These are important "other" emails (home confirmation starts as other before classification)
    if (
      lower.includes('importante') ||
      lower.includes('hogar') ||
      lower.includes('home')
    ) {
      return true;
    }
    return false;
  }
  return true;
}

export async function fetchNetflixEmails(
  config: ImapConfig,
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
): Promise<ParsedEmail[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false as any,
  });

  const emails: ParsedEmail[] = [];

  try {
    await client.connect();
    
    const lock = await client.getMailboxLock('INBOX');
    
    try {
      const searchCriteria = {
        since,
        from: 'netflix',
      };

      for await (const message of client.fetch(searchCriteria, {
        envelope: true,
        source: true,
      })) {
        try {
          const parsed = await simpleParser(message.source);
          const fromAddr = parsed.from?.text || '';
          
          if (!isNetflixEmail(fromAddr)) continue;

          const bodyText = parsed.text || '';
          const bodyHtml = typeof parsed.html === 'string' ? parsed.html : '';
          const subject = parsed.subject || '';
          const emailType = classifyEmail(subject, bodyText);

          // Skip marketing / promotional emails
          if (!isImportantEmail(emailType, subject)) continue;

          const email: ParsedEmail = {
            messageId: message.envelope.messageId || `${Date.now()}-${Math.random()}`,
            from: fromAddr,
            subject,
            bodyText,
            bodyHtml,
            code: extractCode(bodyText, subject),
            link: extractLink(bodyHtml, subject),
            emailType,
            receivedAt: message.envelope.date || new Date(),
          };

          emails.push(email);
        } catch (parseErr) {
          console.error('Error parsing email:', parseErr);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    console.error('IMAP connection error:', error);
    throw error;
  }

  return emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}

export async function testImapConnection(config: ImapConfig): Promise<{ success: boolean; message: string }> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false as any,
  });

  try {
    await client.connect();
    await client.logout();
    return { success: true, message: 'Conexión exitosa a Gmail' };
  } catch (error: any) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
}
