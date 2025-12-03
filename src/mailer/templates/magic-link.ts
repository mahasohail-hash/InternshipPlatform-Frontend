// mailer/templates/magic-link.ts
export function magicLinkTemplate(url: string, email: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${email},</h2>
      <p>Click the button below to sign in to your account:</p>
      <a href="${url}" 
         style="
           display: inline-block;
           padding: 10px 20px;
           font-size: 16px;
           color: white;
           background-color: #1890ff;
           border-radius: 5px;
           text-decoration: none;
         ">
         Sign in
      </a>
      <p>If you did not request this email, you can ignore it.</p>
    </div>
  `;
}
