import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Default settings
const DEFAULT_SETTINGS = {
    USDT_ADDRESS: 'TYaoqvL3QqNfQXt59KtsKNehbS2u3HQTxb',
    MOMO_LINK: '',
    USDT_BONUS_PERCENT: '10',
    USDT_RATE: '655', // 1 USDT = 655 FCFA
};

// Get public settings (no auth required)
export async function GET() {
    try {
        const settings = await prisma.settings.findMany();

        const result: Record<string, string> = { ...DEFAULT_SETTINGS };

        for (const setting of settings) {
            result[setting.key] = setting.value;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json(DEFAULT_SETTINGS);
    }
}
