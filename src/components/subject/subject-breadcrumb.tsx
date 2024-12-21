"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatSlug } from "@/lib/utils";
import { Fragment } from "react";

type Props = {
  locations: string[];
};

const SubjectBreadcrumb = ({ locations }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/library">Library</BreadcrumbLink>
        </BreadcrumbItem>
        {locations.map((location, index) => (
          <Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={
                  index === 0
                    ? `/subject/${formatSlug(location.replace(/AP /g, ""))}`
                    : ``
                }
              >
                {location}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default SubjectBreadcrumb;
