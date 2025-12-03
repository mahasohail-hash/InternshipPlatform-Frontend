"use client"

import { Children } from "react";
import { useRouter } from "next/navigation";
interface LoginButtonProps {
    children : React.ReactNode;
    mod? : "modal" | "redirect",
    asChild ?: boolean;
};

export const LoginButton = ({
    children,
    mod  = "redirect",
    asChild
}: LoginButtonProps ) =>{
    const router = useRouter();
      const onClick =() => {
router.push("/auth/login")
      };
  if (mod === "modal"){
    return(
        <span>
            TODO: implement model 
        </span>
    )
  }



      return (
        <span onClick={onClick} className="cursor-pointer">
            {children}
        </span>
      )

} ; 