export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl p-8 text-white lg:px-8">
      <div className="flex items-center justify-between">
        <img
          src="https://i.imghippo.com/files/KPdmV1720787307.png"
          alt="AProjectLogo"
          className="w-36"
        />
        <ul className="flex flex-col gap-6 sm:flex-row">
          <li>
            <a href="/" className="text-[#2E0F0FB2] hover:underline">
              About
            </a>
          </li>
          <li>
            <a href="/" className="text-[#2E0F0FB2] hover:underline">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="/" className="text-[#2E0F0FB2] hover:underline">
              Copyright
            </a>
          </li>
          <li>
            <a
              href="https://discord.com/invite/apstudents"
              className="text-[#2E0F0FB2] hover:underline"
            >
              Discord
            </a>
          </li>
        </ul>
      </div>
      <hr className="mb-4 border-gray-300" />
      <h6 className="text-xs text-[#2E0F0FB2]">
        &copy; 2024 AP(roject)&trade;. All Rights Reserved.
      </h6>
    </footer>
  );
}
