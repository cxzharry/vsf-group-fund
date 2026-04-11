// Redirect: members list moved to group chat view; legacy route redirects to home
import { redirect } from "next/navigation";

export default function MembersPage() {
  redirect("/");
}
