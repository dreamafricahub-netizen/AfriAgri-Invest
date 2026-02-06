import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Get all settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        const settings = await prisma.settings.findMany();

        const result: Record<string, string> = {
            USDT_ADDRESS: 'TYaoqvL3QqNfQXt59KtsKNehbS2u3HQTxb',
            MOMO_LINK: '',
            USDT_BONUS_PERCENT: '10',
            USDT_RATE: '655',
        };

        for (const setting of settings) {
            result[setting.key] = setting.value;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Admin get settings error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Update settings
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        const body = await req.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ message: 'Cle requise' }, { status: 400 });
        }

        // Upsert the setting
        await prisma.settings.upsert({
            where: { key },
            update: { value: value || '' },
            create: { key, value: value || '' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin update settings error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
