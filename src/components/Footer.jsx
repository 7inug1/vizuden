export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="w-full text-center py-8 mt-4">
      <p
        className="text-xs text-stone-400 uppercase"
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: '0.04em' }}
      >&copy; {year} VIZUDEN</p>
    </div>
  );
}
