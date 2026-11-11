import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Weems</h1>
      <p>
        <Link href="/live">Carte en direct</Link>
      </p>
    </main>
  );
}
