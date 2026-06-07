import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || '';

const isR2Configured = (): boolean => {
  return !!accountId && !!accessKeyId && !!secretAccessKey && !!bucketName && !!publicUrl;
};

const s3Client = isR2Configured()
  ? new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      region: 'auto',
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Fallback if Cloudflare R2 is not configured
    if (!isR2Configured() || !s3Client) {
      console.warn('Cloudflare R2 is not fully configured. Falling back to mock URL.');
      
      // Return a random picsum URL as fallback based on the filename to keep it deterministic or random
      const randomSeed = Math.random().toString(36).substring(7);
      const mockUrl = `https://picsum.photos/seed/uploaded-${randomSeed}/600/400`;
      
      return NextResponse.json({
        success: true,
        url: mockUrl,
        isMock: true,
        message: 'R2 not configured. Returned a mock image url.'
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Format the public URL
    const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
    const finalUrl = `${cleanPublicUrl}${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      isMock: false
    });
  } catch (error: any) {
    console.error('Error in R2 upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
