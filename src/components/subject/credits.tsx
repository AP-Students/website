import Image from "next/image";

interface CreditSectionProps {
  creatorName: string;
  photoURL: string;
  lastUpdated: string;
}

export default function CreditSection({
  creatorName,
  photoURL,
  lastUpdated,
}: CreditSectionProps) {
  return (
    <div className="mt-4 flex items-center space-x-4">
      <Image
        src={photoURL}
        alt={creatorName}
        height={40}
        width={40}
        objectFit="cover"
        className="rounded-full"
      />
      <div>
        <p className="font-semibold">{creatorName}</p>
        <p className="text-sm text-gray-500">Last Updated: {lastUpdated}</p>
      </div>
    </div>
  );
}
