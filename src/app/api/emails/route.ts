import { NextRequest, NextResponse } from 'next/server';
import { fetchNetflixEmails, testImapConnection, type ImapConfig } from '@/lib/imap';
import { db } from '@/lib/db';

const IMAP_CONFIG: ImapConfig = {
  host: 'outlook.office365.com',
  port: 993,
  user: process.env.IMAP_USER || '',
  pass: process.env.IMAP_PASS || '',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '48');
    const forceRefresh = searchParams.get('refresh') === 'true';

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Try to get from database first
    const cachedEmails = await db.netflixEmail.findMany({
      where: {
        receivedAt: {
          gte: since,
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });

    // If not forcing refresh and we have cache, use it
    if (!forceRefresh && cachedEmails.length > 0) {
      const lastFetch = cachedEmails[0].fetchedAt;
      const minutesSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60);

      // Use cache if less than 2 minutes old
      if (minutesSinceLastFetch < 2) {
        return NextResponse.json({
          success: true,
          emails: cachedEmails,
          source: 'cache',
          lastFetch: lastFetch.toISOString(),
          imapConfigured: !!(IMAP_CONFIG.user && IMAP_CONFIG.pass),
        });
      }
    }

    // Try to fetch from IMAP
    if (!IMAP_CONFIG.user || !IMAP_CONFIG.pass) {
      // Return whatever we have in the DB
      return NextResponse.json({
        success: true,
        emails: cachedEmails,
        source: 'cache',
        lastFetch: cachedEmails.length > 0 ? cachedEmails[0].fetchedAt.toISOString() : null,
        imapConfigured: false,
        warning: 'Credenciales IMAP no configuradas. Mostrando datos en caché.',
      });
    }

    try {
      const emails = await fetchNetflixEmails(IMAP_CONFIG, since);

      // Save to database (upsert by messageId)
      let saved = 0;
      for (const email of emails) {
        try {
          await db.netflixEmail.upsert({
            where: { messageId: email.messageId },
            update: {
              code: email.code,
              link: email.link,
              emailType: email.emailType,
              fetchedAt: new Date(),
            },
            create: {
              messageId: email.messageId,
              from: email.from,
              subject: email.subject,
              bodyText: email.bodyText?.substring(0, 5000) || '',
              bodyHtml: email.bodyHtml?.substring(0, 10000) || '',
              code: email.code,
              link: email.link,
              emailType: email.emailType,
              receivedAt: email.receivedAt,
              fetchedAt: new Date(),
            },
          });
          saved++;
        } catch (dbErr) {
          console.error('Error saving email:', dbErr);
        }
      }

      // Return all emails from DB for the time range
      const allEmails = await db.netflixEmail.findMany({
        where: {
          receivedAt: {
            gte: since,
          },
        },
        orderBy: {
          receivedAt: 'desc',
        },
      });

      return NextResponse.json({
        success: true,
        emails: allEmails,
        source: 'imap',
        fetchedCount: saved,
        lastFetch: new Date().toISOString(),
        imapConfigured: true,
      });
    } catch (imapError: any) {
      console.error('IMAP fetch error:', imapError);
      
      // IMAP failed, return cached data with a warning
      return NextResponse.json({
        success: true,
        emails: cachedEmails,
        source: 'cache',
        lastFetch: cachedEmails.length > 0 ? cachedEmails[0].fetchedAt.toISOString() : null,
        imapConfigured: true,
        imapError: true,
        warning: 'No se pudo conectar al servidor de correo. Mostrando últimos datos disponibles. Verifica las credenciales IMAP.',
      });
    }
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await testImapConnection(IMAP_CONFIG);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID requerido' },
        { status: 400 }
      );
    }

    await db.netflixEmail.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
