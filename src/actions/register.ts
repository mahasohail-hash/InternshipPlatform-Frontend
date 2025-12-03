"use server";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { error } from "console";
import { _success } from "zod/v4/core";


export const register  = async(values: z.infer<typeof RegisterSchema>) =>
{
    const validateFields = RegisterSchema.safeParse(values);
    //console.log(values);
    if (!validateFields.success){
        return {error:"Invalid Fields!"};
    }
  return {success:"Email sent!"}
};