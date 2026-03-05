import { redirect } from "react-router";

export function loader() {
  return redirect("/notes");
}

export default function Home() {
  return null;
}
