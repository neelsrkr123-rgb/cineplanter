'use client';
import React from "react";
import ShareableIDCard from "#/components/ShareableIDCard";
import type { ExtendedUser } from "#/types/user";

export default function FreelancerPublicWrapper({ user }: { user: Partial<ExtendedUser> }) {
  return <ShareableIDCard user={user} readOnly />;
}
