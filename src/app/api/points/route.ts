import { NextResponse } from 'next/server';
import PointsModel from '@/models/points-model';
import { connectMongoDb } from '@/lib/db';

export async function GET() {
    try {
        await connectMongoDb();
        const points = await PointsModel.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(points);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch points' },
            { status: 500 }
        );
    }
} 