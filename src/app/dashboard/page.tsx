import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Toda la app vive en la raíz. Redirigimos /dashboard a /.
  redirect("/");
}
