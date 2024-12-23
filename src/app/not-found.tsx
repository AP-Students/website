import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
        <p className="text-xl text-gray-700 mb-6">
          This is a demo site. We have a lot more done and in progress!
        </p>
        <p className="text-lg text-gray-700 mb-6">
          To join the team and help us out,{" "}
          <Link
            href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s"
            className="text-blue-500 underline hover:text-blue-700"
          >
            apply here
          </Link>.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;