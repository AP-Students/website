'use client';

import NextLink from 'next/link';

function HeaderLink({url, children}: any) {
    const classes = 'text-xl w-full text-center outline-link py-1.5 px-1.5 xs:px-3 sm:px-4 whitespace-nowrap';

    if (url.startsWith('https://')) {
      return (
        <div className="flex flex-auto sm:flex-1">
            <a
                href={url}
                className={classes}>
                {children}
            </a>
        </div>
      );
    }

    return (
        <div className="flex flex-auto sm:flex-1">
            <NextLink
                href={url}
                className={classes}>
                {children}
            </NextLink>
        </div>
    );
}

export default function Header() {

    return (
        <>
            <div className="z-50 sticky top-0">
                <nav className="items-center w-full flex justify-between bg-white dark:bg-black border-gray-300 dark:border-gray-800 border-b lg:pe-5 lg:ps-4 z-50">
                    <div className="flex items-center justify-between w-full h-20 gap-0 px-5 sm:gap-3">
                        <div className="flex flex-row 3xl:flex-1 ">              
                            <div className="f">
                                <NextLink
                                    href="/"
                                    className={`active:scale-95 overflow-hidden transition-transform relative items-center text-primary dark:text-primary-dark p-1 whitespace-nowrap outline-link rounded-full 3xl:rounded-xl inline-flex text-lg font-normal gap-2`}
                                >
                                    <span className="text-3xl font-bold">AP(roject)</span>
                                </NextLink>
                            </div>
                        </div>
                        <div className="text-base justify-center items-center gap-1.5 flex 3xl:flex-1 flex-row 3xl:justify-end">
                            <div className="mx-2.5 gap-1.5 hidden lg:flex">
                                <HeaderLink url="/guides">
                                    Study Guides
                                </HeaderLink>
                                <HeaderLink url="/practice">
                                    Practice
                                </HeaderLink>
                                <HeaderLink url="https://discord.com/invite/apstudents">
                                    Discord
                                </HeaderLink>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>
        </>
    )
}