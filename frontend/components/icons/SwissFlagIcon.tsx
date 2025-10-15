// File: frontend/components/icons/SwissFlagIcon.tsx
import React from 'react';

export const SwissFlagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    {...props}
  >
    <path fill="#d52b1e" d="M0 0h32v32H0z" />
    <path
      fill="#fff"
      d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7V6z"
    />
  </svg>
);
