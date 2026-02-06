import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'proofs';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'Aucun fichier fourni' }, { status: 400 });
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ message: 'Type de fichier non autorise. Utilisez JPG, PNG, WEBP ou GIF.' }, { status: 400 });
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ message: 'Fichier trop volumineux. Maximum 5MB.' }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'png';
        const filename = `proof_${timestamp}_${randomString}.${extension}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Check if Supabase is configured
        if (!process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY === 'your_supabase_service_role_key_here') {
            // Fallback to local storage for development
            const { writeFile, mkdir } = await import('fs/promises');
            const { join } = await import('path');
            const { existsSync } = await import('fs');

            const uploadsDir = join(process.cwd(), 'public', 'uploads');
            if (!existsSync(uploadsDir)) {
                await mkdir(uploadsDir, { recursive: true });
            }

            const filepath = join(uploadsDir, filename);
            await writeFile(filepath, buffer);

            return NextResponse.json({ url: `/uploads/${filename}` });
        }

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json({ message: 'Erreur lors de l\'upload' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Erreur lors de l\'upload' }, { status: 500 });
    }
}
