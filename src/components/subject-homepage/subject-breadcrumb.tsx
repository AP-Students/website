"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { type Subject } from "@/types";
import { usePathname } from "next/navigation";

type Properties = {
  subject: Subject;
};

const SubjectBreadcrumb = ({ subject }: Properties) => {
  const router = usePathname();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/library">Library</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={router}>{subject.title}</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default SubjectBreadcrumb;
