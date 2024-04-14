'use client';
import NextLink from 'next/link';

const discordIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="25"
      viewBox="0 0 127.14 96.36">
      <g fill="currentColor">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
      </g>
    </svg>
);

function HeaderItem({url, children}: any) {
  return (
    <div className="flex flex-auto sm:flex-1">
      <NextLink
        href={url}
        className='w-full text-center outline-link py-1.5 px-1.5 xs:px-3 sm:px-4 rounded-full capitalize'>
        {children}
      </NextLink>
    </div>
  );
}

export default function Header() {
  return (
    <div className='z-50 sticky top-0'>
      <nav
        className='items-center w-full flex justify-between bg-white border-b border-gray-300 px-1.5 lg:pe-12 lg:ps-12 z-50'>
        <div className="flex items-center justify-between w-full h-16">
          <div className="flex 3xl:flex-1 align-center">
            <NextLink
              href="/"
              className='p-1 text-2xl font-semibold'>
                <span>AP(roject)</span>
            </NextLink>
          </div>
        </div>
        <div className="text-lg justify-center items-center flex 3xl:flex-1 flex-row 3xl:justify-end">
          <div className="w-72 mx-2.5 lg:flex">
            <div className="flex flex-auto sm:flex-1">
              <HeaderItem url="/guides">
                Study Guides
              </HeaderItem>
              <HeaderItem url="/practice">
                Practice
              </HeaderItem>
            </div>
          </div>
          <div className="flex items-center -space-x-2.5 xs:space-x-0 ">
            <div className="flex">
              <NextLink
                href="https://discord.gg/apstudents"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Join Discord"
                className="flex items-center justify-center">
                {discordIcon}
              </NextLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}