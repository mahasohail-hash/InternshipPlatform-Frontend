"use client";

import { CardWrapper } from "./card-wrapper"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {

Form,
FormControl,
FormField,
FormItem,
FormLabel, 
FormMessage,
}from "../../../components/ui/form";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { register } from "@/actions/register";
import { startTransition, useState, useTransition } from "react";
import { error } from "console";



export const RegisterForm = () =>{
    const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
    const [isPending , isstartTransition] =useTransition();
    const form =useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues:{
            email:"",
            Password:"",
            name:"",
        },
    });
   const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      register(values)
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
    });
  };

    return(
       <CardWrapper  
       headerLabel="Create an account"
       backButtonLabel="Already have an account"
       backButtonHref="/auth/login"
       showSocial
       >
        <Form {...form}>
            <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            >
                <div className="space-y-4">
                    <FormField
                control={form.control}
                name="name"
                render= {({field}) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input
                            {...field}
                            placeholder="Enter your name"
                            type="name"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render= {({field}) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input
                            {...field}
                            placeholder="john@example.com"
                            type="email"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="Password"
                render= {({field}) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input
                            {...field}
                            placeholder="******"
                            type="Password"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
                />
                </div>
                <FormError message={error}/>
                <FormSuccess message={success}/>
                <button  type="submit" className="w-full">
                    Create an account
                </button>
            </form>
        </Form>
            
  </CardWrapper>
    );
};