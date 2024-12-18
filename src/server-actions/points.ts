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

export const AddPoints = async ({ pointsId, payload }: {
    pointsId: string,
    payload: EditPointsPayload
}) => {
    console.log("Points server action called");
    try {
        const newPoints = new PointsModel({ 
            points: payload.points,
            childid: payload.childid,
            secondstoaccumulate: payload.secondstoaccumulate,
            secondstospend: payload.secondstospend
        });
        const savedPoints = await newPoints.save();
        
        // Frissítjük az összes releváns útvonalat
        revalidatePath('/');
 

        return {
            success: true,
            message: 'Points added successfully',
            
        }
    } catch (e: unknown) {
        console.error(e);
        return {
            success: false,
            message: e instanceof Error ? e.message : 'Unknown error'
        }
    }
}

interface EditPointsPayload {
    points: number;
    childid: string;
    secondstoaccumulate: number;
    secondstospend: number;
}

export const EditPoints = async ({ pointsId, payload }: {
    pointsId: string,
    payload: EditPointsPayload
}) => {

    console.log("EditPoints server action called", payload);
    try {
        await PointsModel.findByIdAndUpdate(pointsId, payload);
        revalidatePath('/')
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