// Redirect: profile page replaced by account page
import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/account");
}
