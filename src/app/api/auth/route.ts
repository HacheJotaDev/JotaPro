import { NextRequest, NextResponse } from 'next/server';

const APP_PIN = process.env.APP_PIN || '1234';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { success: false, message: 'PIN requerido' },
        { status: 400 }
      );
    }

    if (pin === APP_PIN) {
      return NextResponse.json({
        success: true,
        message: 'Autenticación exitosa',
        token: Buffer.from(`${pin}:${Date.now()}`).toString('base64'),
      });
    }

    return NextResponse.json(
      { success: false, message: 'PIN incorrecto' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    );
  }
}
