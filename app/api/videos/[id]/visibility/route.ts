import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { visible } = body;

    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'Invalid video id', details: params.id },
        { status: 400 },
      );
    }

    if (typeof visible !== 'boolean') {
      return NextResponse.json(
        { error: 'visible must be a boolean', details: body },
        { status: 400 },
      );
    }

    const video = await prisma.video.update({
      where: { id },
      data: { visible },
    });

    return NextResponse.json({ success: true, video });
  } catch (err: any) {
    console.error('Error updating visibility', err);
    return NextResponse.json(
      {
        error: 'Failed to update visibility',
        details: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
