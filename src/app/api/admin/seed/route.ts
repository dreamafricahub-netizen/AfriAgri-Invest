import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// This endpoint creates or updates the admin account
// Should be called once then disabled in production
export async function GET() {
    try {
        const email = 'dreamafricahub@gmail.com';
        const password = 'dreamafricahub@gmail.com';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            // Update password
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
            return NextResponse.json({
                message: 'Admin account updated',
                email
            });
        } else {
            // Create admin
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Admin AfriAgri',
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    balance: 0,
                    investedCapital: 0,
                    referralCode: 'ADMIN001',
                }
            });
            return NextResponse.json({
                message: 'Admin account created',
                email
            });
        }
    } catch (error: any) {
        console.error('Seed admin error:', error);
        return NextResponse.json({
            message: 'Error',
            error: error.message
        }, { status: 500 });
    }
}
