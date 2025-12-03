"use server";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { error } from "console";
import { _success } from "zod/v4/core";


export const login = async(values: z.infer<typeof LoginSchema>) =>
{
    const validateFields = LoginSchema.safeParse(values);
    //console.log(values);
    if (!validateFields.success){
        return {error:"Invalid Fields!"};
    }
  return {success:"Email sent!"}
};