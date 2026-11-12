import { Redirect } from "expo-router";

// Root route: hands off straight to the chat screen.
// (Auth gating already happens in the root _layout.tsx.)
export default function Index() {
  return <Redirect href={"/chat" as any} />;
}
