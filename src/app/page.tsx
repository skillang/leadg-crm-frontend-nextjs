// import LoginPage from "@/pages/LoginPage.jsx";

// export default function Home() {
//   return (
//     <div>
//       <LoginPage />
//     </div>
//   );
// }

// src/app/page.tsx (Simplest approach - no build errors)

import { redirect } from "next/navigation";

export default function Home() {
  // Server-side redirect - no client-side code, no Redux needed
  redirect("/dashboard");
}
