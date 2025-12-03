"use client";

import { CardWrapper } from "./card-wrapper"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import * as z from "zod";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";
import { startTransition, useState, useTransition } from "react";
import { error } from "console";



export const LoginForm = () =>{
    const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
    const [isPending , isstartTransition] =useTransition();
    const form =useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues:{
            email:"",
            Password:"",
        },
    });
   const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      login(values)
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
    });
  };

    return(
       <CardWrapper  
       headerLabel="Welcome Back"
       backButtonLabel="Don't have a account?"
       backButtonHref="/auth/register"
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
                      Login
                </button>
            </form>
        </Form>
            
  </CardWrapper>
    );
};