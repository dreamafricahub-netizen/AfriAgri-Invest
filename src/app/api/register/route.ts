import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Generate a unique referral code
function generateReferralCode(name: string): string {
    const prefix = name ? name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) : 'USER';
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
}

export async function POST(req: Request) {
    try {
        const { email, password, name, phone, referredBy } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Cet email est deja utilise' },
                { status: 400 }
            );
        }

        // Generate unique referral code
        let referralCode = generateReferralCode(name || '');
        let codeExists = await prisma.user.findUnique({ where: { referralCode } });
        while (codeExists) {
            referralCode = generateReferralCode(name || '');
            codeExists = await prisma.user.findUnique({ where: { referralCode } });
        }

        // Check if referredBy code is valid
        let sponsor = null;
        if (referredBy) {
            sponsor = await prisma.user.findUnique({
                where: { referralCode: referredBy },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with welcome bonus of 3000 F
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || '',
                phone: phone || '',
                balance: 3000, // Welcome bonus
                investedCapital: 0,
                referralCode,
                referredBy: sponsor ? referredBy : null,
            },
        });

        // If user was referred, create the referral relationship
        if (sponsor) {
            await prisma.referral.create({
                data: {
                    sponsorId: sponsor.id,
                    referredId: user.id,
                    totalInvested: 0,
                    totalBonus: 0,
                },
            });
        }

        // Create welcome bonus transaction
        await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'BONUS',
                amount: 3000,
                status: 'COMPLETED',
                description: 'Bonus de bienvenue',
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'Inscription reussie', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Erreur lors de l\'inscription' },
            { status: 500 }
        );
    }
}
