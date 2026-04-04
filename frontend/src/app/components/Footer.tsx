export function Footer() {
  return (
    <footer className="bg-[#4a3f1a] text-[#c8bfa4] mt-auto">
      <div className="max-w-[1100px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-[14px]">
          {/* Company */}
          <div>
            <div className="text-white mb-3 text-[16px]">COMPANY</div>
            <ul className="space-y-1">
              {[
                "About us",
                "Careers",
                "Terms",
                "Privacy",
                "Interest Based Ads",
                "Ad Preferences",
                "Help",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="hover:text-white no-underline text-[#c8bfa4]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Work with us */}
          <div>
            <div className="text-white mb-3 text-[16px]">WORK WITH US</div>
            <ul className="space-y-1">
              {["Authors", "Advertise", "Authors & ads blog"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="hover:text-white no-underline text-[#c8bfa4]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-white mb-3 text-[16px]">Checking CI/CD</div>
          </div>

          {/* Connect */}
          {/* <div>
            <div className="text-white mb-3 text-[15px]">Connect</div>
            <div className="flex gap-2 mt-1">
              {["f", "t", "in", "ig"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-8 h-8 rounded-full border border-[#c8bfa4] flex items-center justify-center text-[12px] text-[#c8bfa4] hover:text-white hover:border-white no-underline"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div> */}
          {/* Copyright */}
          {/* <div className="text-right">
            <p className="text-[14px]">© 2026 Goodreads LLC</p>
            <a
              href="#"
              className="text-[14px] text-[#c8bfa4] hover:text-white no-underline"
            >
              Mobile Version
            </a>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
