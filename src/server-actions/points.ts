'use server'


import { connectMongoDb } from "@/lib/db";
import PointsModel from "@/models/points-model";

import { revalidatePath } from "next/cache";

connectMongoDb();

interface Points {
    name: string;
    value: number;
    // további mezők a PointsModel alapján...
}

export const AddPoints = async (payload: number) => {
    console.log("Points server action called");
    try {
        const newPoints = new PointsModel({ points: payload });
        await newPoints.save();
        
        return {
            success: true,
            message: 'Points added succesfully'
        }
    } catch (e: unknown) {
        console.log(e);
        return {
            success: false,
            message: e instanceof Error ? e.message : 'Unknown error'
        }
    }
}

export const EditPoints = async ({ pointsId, payload }:
    {
        pointsId: string,
        payload: number
    }) => {
    try {
        await PointsModel.findByIdAndUpdate(pointsId, { points: payload });
        revalidatePath('/admin/points')
        return {
            success: true,
            message: 'Edit succesful'
        }


    } catch (e: any) {

        console.log(e);
        return {
            success: false,
            message: e.message

        }

    }


}

export const DeletePoints = async ( pointsId: string) => {
    try {
        await PointsModel.findByIdAndDelete(pointsId);
        revalidatePath('/admin/points')
        return {
            success: true,
            message: 'Delete succesful'
        }


    } catch (e: any) {

        console.log(e);
        return {
            success: false,
            message: e.message

        }

    }


}