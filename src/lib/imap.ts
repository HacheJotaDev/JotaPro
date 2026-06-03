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
  emailType: 'verification' | 'geo_confirmation' | 'login_alert' | 'other';
  receivedAt: Date;
}

const NETFLIX_SENDERS = [
  'info@mailer.netflix.com',
  'info@netflix.com',
  'no-reply@netflix.com',
  'help@netflix.com',
  'info@mailer.netflix.com',
  'notification@netflix.com',
];

function isNetflixEmail(from: string): boolean {
  const lower = from.toLowerCase();
  return NETFLIX_SENDERS.some(sender => lower.includes(sender)) || lower.includes('netflix');
}

function extractCode(text: string): string | null {
  // Netflix verification codes are typically 4-8 digit numbers or alphanumeric
  const patterns = [
    /c[oó]digo[:\s]*(\d{4,8})/i,
    /code[:\s]*(\d{4,8})/i,
    /verification[:\s]*(\d{4,8})/i,
    /PIN[:\s]*(\d{4,8})/i,
    /(\d{4,8})\s*(?:is your|es tu|es su|verification|c[oó]digo)/i,
    /enter[:\s]*(\d{4,8})/i,
    /use[:\s]*(\d{4,8})/i,
    /(?:your|tu|su)\s+(?:code|c[oó]digo|PIN)[:\s]*(\d{4,8})/i,
    /\b(\d{6})\b/,  // 6-digit code (most common for Netflix)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractLink(html: string): string | null {
  // Netflix confirmation/geo links
  const patterns = [
    /href="(https:\/\/www\.netflix\.com\/[^"]*confirm[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/[^"]*verify[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/[^"]*device[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/[^"]*travel[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/[^"]*authenticate[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/[^"]*action[^"]*)"/i,
    /href="(https:\/\/www\.netflix\.com\/account[^"]*)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function classifyEmail(subject: string, body: string): ParsedEmail['emailType'] {
  const combined = (subject + ' ' + body).toLowerCase();
  
  if (
    combined.includes('geolocal') ||
    combined.includes('geo-verification') ||
    combined.includes('travel') ||
    combined.includes('viaje') ||
    combined.includes('ubicación') ||
    combined.includes('location') ||
    combined.includes('unusual sign-in') ||
    combined.includes('inicio de sesión inusual') ||
    combined.includes('new device') ||
    combined.includes('nuevo dispositivo') ||
    combined.includes('confirm your sign-in') ||
    combined.includes('confirma tu inicio') ||
    combined.includes('verify your identity') ||
    combined.includes('verifica tu identidad') ||
    combined.includes('we noticed a new sign-in') ||
    combined.includes('notado un nuevo inicio')
  ) {
    return 'geo_confirmation';
  }

  if (
    combined.includes('verification code') ||
    combined.includes('código de verificación') ||
    combined.includes('verify your email') ||
    combined.includes('verifica tu correo') ||
    combined.includes('sign-in code') ||
    combined.includes('código de inicio')
  ) {
    return 'verification';
  }

  if (
    combined.includes('new sign-in') ||
    combined.includes('nuevo inicio de sesión') ||
    combined.includes('signed in') ||
    combined.includes('inició sesión') ||
    combined.includes('your account') ||
    combined.includes('tu cuenta')
  ) {
    return 'login_alert';
  }

  return 'other';
}

export async function fetchNetflixEmails(
  config: ImapConfig,
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h by default
): Promise<ParsedEmail[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    authType: 'LOGIN',
    logger: false as any,
  });

  const emails: ParsedEmail[] = [];

  try {
    await client.connect();
    
    const lock = await client.getMailboxLock('INBOX');
    
    try {
      // Search for Netflix emails since the given date
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
          const bodyHtml = parsed.html || '';
          const subject = parsed.subject || '';

          const email: ParsedEmail = {
            messageId: message.envelope.messageId || `${Date.now()}-${Math.random()}`,
            from: fromAddr,
            subject,
            bodyText,
            bodyHtml,
            code: extractCode(bodyText),
            link: extractLink(typeof bodyHtml === 'string' ? bodyHtml : ''),
            emailType: classifyEmail(subject, bodyText),
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

  // Sort by most recent first
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
    authType: 'LOGIN',
    logger: false as any,
  });

  try {
    await client.connect();
    await client.logout();
    return { success: true, message: 'Conexión exitosa a Hotmail/Outlook' };
  } catch (error: any) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
}
