import { Button } from "./Button";

export function NPMInstall() {
  return (
    <div className="relative isolate mt-8 flex items-center pr-1">
      <div className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-[0.8125rem]/6">
        npm install @hck23/simple-q
      </div>
      <Button
        onClick={() => {
          navigator.clipboard.writeText("npm install @hck23/simple-q");
        }}>
        Copy
      </Button>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </div>
  );
}
